import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaterialOrder, OrderStatus } from '../entities/material-order.entity';
import { CreateMaterialOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { HttpService } from '@nestjs/axios';
import { MaterialsGateway } from '../materials.gateway';
import { WebSocketService } from './websocket.service';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(MaterialOrder.name) private orderModel: Model<MaterialOrder>,
    private readonly httpService: HttpService,
    private readonly materialsGateway: MaterialsGateway,
    @Inject(forwardRef(() => WebSocketService))
    private readonly webSocketService: WebSocketService,
    private readonly paymentService: PaymentService,
  ) {}

  async createOrder(createOrderDto: CreateMaterialOrderDto, userId: string | null): Promise<MaterialOrder> {
    this.logger.log('=== DEBUT createOrder ===');
    this.logger.log('Input:', JSON.stringify(createOrderDto));
    
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const createObjectId = (id: string, fieldName: string): Types.ObjectId => {
      if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new Error(`Invalid ${fieldName}: "${id}" (length: ${id?.length})`);
      }
      return new Types.ObjectId(id);
    };
    
    const materialIdObj = createObjectId(createOrderDto.materialId, 'materialId');
    const siteIdObj = createObjectId(createOrderDto.destinationSiteId, 'destinationSiteId');
    const supplierIdObj = createObjectId(createOrderDto.supplierId, 'supplierId');
    
    this.logger.log('IDs validated, fetching external data...');
    
    let siteData: any;
    try {
      siteData = await this.getSiteData(createOrderDto.destinationSiteId);
    } catch (e: any) {
      this.logger.error('Failed to get site data:', e.message);
      siteData = { nom: 'Chantier', adresse: 'Adresse inconnue', coordinates: { lat: 0, lng: 0 } };
    }
    
    let supplierData: any;
    try {
      supplierData = await this.getSupplierData(createOrderDto.supplierId);
    } catch (e: any) {
      this.logger.error('Failed to get supplier data:', e.message);
      supplierData = { nom: 'Fournisseur', adresse: 'Adresse inconnue', coordinates: { lat: 0, lng: 0 } };
    }
    
    let materialData: any;
    try {
      materialData = await this.getMaterialData(createOrderDto.materialId);
    } catch (e: any) {
      this.logger.error('Failed to get material data:', e.message);
      materialData = { name: 'Matériau', code: 'UNKNOWN' };
    }

    const now = new Date();
    const scheduledDeparture = now;
    const scheduledArrival = new Date(now.getTime() + createOrderDto.estimatedDurationMinutes * 60 * 1000);
    
    const order = new this.orderModel({
      orderNumber,
      materialId: materialIdObj,
      materialName: materialData.name,
      materialCode: materialData.code,
      quantity: createOrderDto.quantity,
      destinationSiteId: siteIdObj,
      destinationSiteName: siteData.nom,
      destinationAddress: siteData.adresse,
      destinationCoordinates: siteData.coordinates || { lat: 0, lng: 0 },
      supplierId: supplierIdObj,
      supplierName: supplierData.nom,
      supplierAddress: supplierData.adresse,
      supplierCoordinates: supplierData.coordinates || { lat: 0, lng: 0 },
      estimatedDurationMinutes: createOrderDto.estimatedDurationMinutes,
      remainingTimeMinutes: createOrderDto.estimatedDurationMinutes,
      currentPosition: supplierData.coordinates || { lat: 0, lng: 0 },
      progress: 0,
      status: OrderStatus.PENDING,
      scheduledDeparture,
      scheduledArrival,
      notes: createOrderDto.notes,
    });

    const savedOrder = await order.save();
    this.logger.log('Order saved successfully:', savedOrder._id);
    
    this.materialsGateway.emitOrderUpdate('orderCreated', savedOrder);
    
    this.webSocketService.emitDeliveryProgress(
      savedOrder._id.toString(),
      0,
      savedOrder.currentPosition || { lat: 0, lng: 0 }
    );
    
    return savedOrder;
  }

  async getAllOrders(filters?: { status?: string; siteId?: string; supplierId?: string }): Promise<MaterialOrder[]> {
    try {
      const filter: any = {};
      if (filters?.status) filter.status = filters.status;
      if (filters?.siteId) filter.destinationSiteId = new Types.ObjectId(filters.siteId);
      if (filters?.supplierId) filter.supplierId = new Types.ObjectId(filters.supplierId);
      return await this.orderModel.find(filter).sort({ createdAt: -1 }).exec();
    } catch (error) {
      this.logger.error(`❌ Erreur récupération commandes: ${error.message}`);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<MaterialOrder> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('ID de commande invalide');
    }
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Commande #${orderId} non trouvée`);
    return order;
  }

  async getActiveOrders(): Promise<MaterialOrder[]> {
    return await this.orderModel.find({
      status: { $in: [OrderStatus.PENDING, OrderStatus.IN_TRANSIT, OrderStatus.DELAYED] }
    }).sort({ scheduledArrival: 1 }).exec();
  }

  async updateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto): Promise<MaterialOrder> {
    const order = await this.getOrderById(orderId);
    order.status = updateDto.status as OrderStatus;
    
    if (updateDto.currentPosition) {
      order.currentPosition = updateDto.currentPosition;
      order.progress = this.calculateProgress(
        order.supplierCoordinates,
        order.destinationCoordinates,
        updateDto.currentPosition
      );
      order.remainingTimeMinutes = this.calculateRemainingTime(
        order.estimatedDurationMinutes,
        order.progress
      );
    }

    if (updateDto.status === OrderStatus.IN_TRANSIT && !order.actualDeparture) {
      order.actualDeparture = new Date();
    }

    if (updateDto.status === OrderStatus.DELIVERED) {
      order.actualArrival = new Date();
      order.progress = 100;
      order.remainingTimeMinutes = 0;
      
      this.logger.log(`✅ Commande livrée: ${order.orderNumber}`);
      this.materialsGateway.emitNotification({
        type: 'delivery_complete',
        title: 'Commande livrée',
        message: `La commande ${order.orderNumber} est arrivée à destination: ${order.destinationSiteName}`,
        orderId: order._id.toString(),
        timestamp: new Date(),
      });
      
      this.webSocketService.emitArrival(order._id.toString(), order.supplierName);
    }

    const updatedOrder = await order.save();
    this.materialsGateway.emitOrderUpdate('orderStatusUpdated', updatedOrder);
    this.webSocketService.emitDeliveryProgress(orderId, updatedOrder.progress, updatedOrder.currentPosition);
    
    return updatedOrder;
  }

  async updateOrderProgress(orderId: string, currentPosition: { lat: number; lng: number }): Promise<MaterialOrder> {
    const order = await this.getOrderById(orderId);

    order.currentPosition = currentPosition;
    order.progress = this.calculateProgress(
      order.supplierCoordinates,
      order.destinationCoordinates,
      currentPosition
    );
    order.remainingTimeMinutes = this.calculateRemainingTime(
      order.estimatedDurationMinutes,
      order.progress
    );

    let wasPending = false;
    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.IN_TRANSIT;
      order.actualDeparture = new Date();
      wasPending = true;
      this.materialsGateway.emitNotification({
        type: 'delivery_started',
        title: 'Livraison démarrée',
        message: `La livraison de ${order.materialName} vers ${order.destinationSiteName} a commencé`,
        orderId: order._id.toString(),
        timestamp: new Date(),
      });
    }

    const updatedOrder = await order.save();
    
    this.materialsGateway.emitOrderProgressUpdate(orderId, {
      progress: updatedOrder.progress,
      remainingTimeMinutes: updatedOrder.remainingTimeMinutes,
      currentPosition: updatedOrder.currentPosition,
    });
    
    this.webSocketService.emitDeliveryProgress(orderId, updatedOrder.progress, updatedOrder.currentPosition);
    this.webSocketService.emitLocationUpdate(orderId, updatedOrder.currentPosition, 'System');
    
    if (wasPending) {
      this.webSocketService.emitDeliveryProgress(orderId, 5, currentPosition);
    }
    
    if (updatedOrder.progress >= 100) {
      this.webSocketService.emitArrival(orderId, updatedOrder.supplierName);
    }

    return updatedOrder;
  }

  async simulateDelivery(orderId: string): Promise<MaterialOrder> {
    const order = await this.getOrderById(orderId);
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Commande déjà livrée');
    }

    const steps = 20;
    let currentStep = 0;
    const startPos = order.destinationCoordinates;
    const endPos = order.supplierCoordinates;
    const stepLat = (endPos.lat - startPos.lat) / steps;
    const stepLng = (endPos.lng - startPos.lng) / steps;

    const simulateStep = async () => {
      if (currentStep >= steps) return;
      currentStep++;
      const newPosition = {
        lat: startPos.lat + stepLat * currentStep,
        lng: startPos.lng + stepLng * currentStep,
      };
      await this.updateOrderProgress(orderId, newPosition);
    };

    for (let i = 0; i < steps; i++) {
      await simulateStep();
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return await this.updateOrderStatus(orderId, {
      status: OrderStatus.DELIVERED,
      currentPosition: endPos,
    });
  }

  // ========== MÉTHODES PAIEMENT ==========

  async processArrivalPayment(
    orderId: string,
    paymentMethod: 'cash' | 'card',
  ): Promise<{ success: boolean; payment: any; message: string }> {
    try {
      this.logger.log(`💳 Traitement paiement commande ${orderId}, méthode: ${paymentMethod}`);
      
      const order = await this.getOrderById(orderId);
      
      if (order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException('Le paiement est autorisé uniquement après arrivée du camion');
      }

      if (order.paymentId) {
        const existingStatus = await this.paymentService.getPaymentStatus(order.paymentId);
        const resolvedStatus = existingStatus?.status || order.paymentStatus;

        if (resolvedStatus === 'completed') {
          throw new BadRequestException('Cette commande est déjà payée');
        }

        if (paymentMethod !== 'card') {
          throw new BadRequestException('Un paiement est déjà en cours pour cette commande');
        }

        this.logger.warn(
          `♻️ Paiement carte en cours détecté pour ${orderId}. Recréation d'une nouvelle tentative de paiement.`,
        );
      }

      const amount = await this.calculateOrderAmount(order);
      
      const description = `Paiement commande ${order.orderNumber} - ${order.materialName} (x${order.quantity})`;

      const paymentResult = await this.paymentService.createPayment(
        order.destinationSiteId.toString(),
        amount,
        paymentMethod,
        description,
      );

      order.paymentId = paymentResult.paymentId;
      order.paymentAmount = amount;
      order.paymentMethod = paymentMethod;
      order.paymentStatus = paymentResult.status;
      await order.save();

      this.logger.log(`✅ Paiement créé pour commande ${orderId}: ${paymentResult.paymentId}`);

      return {
        success: true,
        payment: paymentResult,
        message: paymentResult.message,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur traitement paiement: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async confirmCardPayment(
    orderId: string,
    stripePaymentIntentId: string,
  ): Promise<{ success: boolean; payment: any; message: string }> {
    try {
      this.logger.log(`✅ Confirmation paiement Stripe pour commande ${orderId}`);
      
      const order = await this.getOrderById(orderId);
      
      if (!order.paymentId) {
        throw new BadRequestException('Aucun paiement trouvé pour cette commande');
      }

      if (order.paymentMethod !== 'card') {
        throw new BadRequestException('Le paiement à confirmer doit être un paiement par carte');
      }

      const confirmationResult = await this.paymentService.confirmCardPayment(
        order.paymentId,
        stripePaymentIntentId,
      );

      order.paymentStatus = 'completed';
      await order.save();

      this.logger.log(`🎉 Paiement confirmé pour commande ${orderId}`);

      return {
        success: true,
        payment: confirmationResult,
        message: 'Paiement confirmé avec succès!',
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur confirmation paiement: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      const order = await this.getOrderById(orderId);
      
      if (!order.paymentId) {
        return { hasPayment: false, status: null };
      }

      const paymentStatus = await this.paymentService.getPaymentStatus(order.paymentId);
      
      return {
        hasPayment: true,
        paymentId: order.paymentId,
        amount: order.paymentAmount,
        method: order.paymentMethod,
        status: paymentStatus?.status || order.paymentStatus,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur récupération statut paiement: ${error.message}`);
      return { hasPayment: false, error: error.message };
    }
  }

  // ========== MÉTHODE FACTURE ==========

  async generateInvoiceForOrder(orderId: string, siteNom: string): Promise<any> {
    try {
      const order = await this.getOrderById(orderId);
      
      if (!order.paymentId) {
        throw new BadRequestException('Aucun paiement trouvé pour cette commande');
      }

      const invoice = await this.paymentService.generateInvoice(order.paymentId, siteNom);
      
      this.logger.log(`📄 Facture générée pour commande ${orderId}: ${invoice?.numeroFacture}`);
      
      return invoice;
    } catch (error: any) {
      this.logger.error(`❌ Erreur génération facture: ${error.message}`);
      return null;
    }
  }

  private async calculateOrderAmount(order: MaterialOrder): Promise<number> {
    try {
      const unitPrice = await this.getMaterialUnitPrice(order.materialId.toString());
      const amount = unitPrice * order.quantity;
      return Math.round(amount * 100) / 100;
    } catch (error) {
      this.logger.error(`❌ Erreur calcul montant: ${error.message}`);
      return order.quantity * 100;
    }
  }

  private async getMaterialUnitPrice(materialId: string): Promise<number> {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3002/api/materials/${materialId}`
      );
      return response.data?.unitPrice || response.data?.price || 100;
    } catch (error) {
      this.logger.warn(`⚠️ Prix par défaut pour matériau ${materialId}`);
      return 100;
    }
  }

  private calculateProgress(start: any, end: any, current: any): number {
    const totalDistance = this.calculateDistance(start, end);
    const traveledDistance = this.calculateDistance(start, current);
    if (totalDistance === 0) return 100;
    return Math.min(100, Math.max(0, (traveledDistance / totalDistance) * 100));
  }

  private calculateDistance(point1: any, point2: any): number {
    const R = 6371;
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateRemainingTime(totalMinutes: number, progress: number): number {
    return Math.max(0, totalMinutes * (1 - progress / 100));
  }

  private async getSiteData(siteId: string): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(`http://localhost:3001/api/gestion-sites/${siteId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération site: ${error.message}`);
      throw error;
    }
  }

  private async getSupplierData(supplierId: string): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(`http://localhost:3005/fournisseurs/${supplierId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération fournisseur: ${error.message}`);
      throw error;
    }
  }

  private async getMaterialData(materialId: string): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(`http://localhost:3002/api/materials/${materialId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération matériau: ${error.message}`);
      throw error;
    }
  }
}