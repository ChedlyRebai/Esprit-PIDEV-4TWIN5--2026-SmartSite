import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaterialOrder, OrderStatus } from '../entities/material-order.entity';
import { CreateMaterialOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { HttpService } from '@nestjs/axios';
import { MaterialsGateway } from '../materials.gateway';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(MaterialOrder.name) private orderModel: Model<MaterialOrder>,
    private readonly httpService: HttpService,
    private readonly materialsGateway: MaterialsGateway,
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
    
    // Get site data
    this.logger.log('Fetching site data for:', createOrderDto.destinationSiteId);
    let siteData: any;
    try {
      siteData = await this.getSiteData(createOrderDto.destinationSiteId);
      this.logger.log('Site data fetched:', JSON.stringify(siteData));
    } catch (e: any) {
      this.logger.error('Failed to get site data:', e.message);
      siteData = { nom: 'Chantier', adresse: 'Adresse inconnue', coordinates: { lat: 0, lng: 0 } };
    }
    
    // Get supplier data
    this.logger.log('Fetching supplier data for:', createOrderDto.supplierId);
    let supplierData: any;
    try {
      supplierData = await this.getSupplierData(createOrderDto.supplierId);
      this.logger.log('Supplier data fetched:', JSON.stringify(supplierData));
    } catch (e: any) {
      this.logger.error('Failed to get supplier data:', e.message);
      supplierData = { nom: 'Fournisseur', adresse: 'Adresse inconnue', coordinates: { lat: 0, lng: 0 } };
    }
    
    // Get material data
    this.logger.log('Fetching material data for:', createOrderDto.materialId);
    let materialData: any;
    try {
      materialData = await this.getMaterialData(createOrderDto.materialId);
      this.logger.log('Material data fetched:', JSON.stringify(materialData));
    } catch (e: any) {
      this.logger.error('Failed to get material data:', e.message);
      materialData = { name: 'Matériau', code: 'UNKNOWN' };
    }

    this.logger.log('All data fetched. Creating order object...');
    
    const now = new Date();
    const scheduledDeparture = now;
    const scheduledArrival = new Date(now.getTime() + createOrderDto.estimatedDurationMinutes * 60 * 1000);

    this.logger.log('Creating Mongoose document...');
    
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

    this.logger.log('Document created. Saving to MongoDB...');
    
    const savedOrder = await order.save();
    this.logger.log('Order saved successfully:', savedOrder._id);
    
    this.materialsGateway.emitOrderUpdate('orderCreated', savedOrder);
    
    this.logger.log('=== FIN createOrder - SUCCESS ===');
    return savedOrder;
  }

  async getAllOrders(filters?: { status?: string; siteId?: string; supplierId?: string }): Promise<MaterialOrder[]> {
    try {
      const filter: any = {};
      
      if (filters?.status) {
        filter.status = filters.status;
      }
      if (filters?.siteId) {
        filter.destinationSiteId = new Types.ObjectId(filters.siteId);
      }
      if (filters?.supplierId) {
        filter.supplierId = new Types.ObjectId(filters.supplierId);
      }

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
    if (!order) {
      throw new NotFoundException(`Commande #${orderId} non trouvée`);
    }

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
    }

    const updatedOrder = await order.save();
    this.materialsGateway.emitOrderUpdate('orderStatusUpdated', updatedOrder);
    
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

    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.IN_TRANSIT;
      order.actualDeparture = new Date();
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

    return updatedOrder;
  }

  async simulateDelivery(orderId: string): Promise<MaterialOrder> {
    const order = await this.getOrderById(orderId);
    
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Commande déjà livrée');
    }

    const steps = 10;
    let currentStep = 0;
    const startPos = order.supplierCoordinates;
    const endPos = order.destinationCoordinates;
    const stepLat = (endPos.lat - startPos.lat) / steps;
    const stepLng = (endPos.lng - startPos.lng) / steps;

    const simulateStep = async () => {
      if (currentStep >= steps) {
        return;
      }

      currentStep++;
      const newPosition = {
        lat: startPos.lat + stepLat * currentStep,
        lng: startPos.lng + stepLng * currentStep,
      };

      await this.updateOrderProgress(orderId, newPosition);
      this.logger.log(`📍 Progression: ${(currentStep / steps * 100).toFixed(0)}%`);
    };

    for (let i = 0; i < steps; i++) {
      await simulateStep();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const finalOrder = await this.updateOrderStatus(orderId, {
      status: OrderStatus.DELIVERED,
      currentPosition: endPos,
    });

    return finalOrder;
  }

  private calculateProgress(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    current: { lat: number; lng: number }
  ): number {
    const totalDistance = this.calculateDistance(start, end);
    const traveledDistance = this.calculateDistance(start, current);
    
    if (totalDistance === 0) return 100;
    
    const progress = (traveledDistance / totalDistance) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3001/api/gestion-sites/${siteId}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération site: ${error.message}`);
      this.logger.error(`❌ Stack: ${error.stack}`);
      throw error;
    }
  }

  private async getSupplierData(supplierId: string): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3005/fournisseurs/${supplierId}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération fournisseur: ${error.message}`);
      this.logger.error(`❌ Stack: ${error.stack}`);
      throw error;
    }
  }

  private async getMaterialData(materialId: string): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3002/api/materials/${materialId}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération matériau: ${error.message}`);
      this.logger.error(`❌ Stack: ${error.stack}`);
      throw error;
    }
  }
}