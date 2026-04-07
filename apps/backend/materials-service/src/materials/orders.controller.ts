import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OrdersService } from './services/orders.service';
import { CreateMaterialOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() createOrderDto: CreateMaterialOrderDto,
  ) {
    const userId = 'system';
    console.log('📥 === ORDERS CONTROLLER ===');
    console.log('📥 createOrderDto:', createOrderDto);
    console.log('📥 materialId raw:', createOrderDto.materialId);
    console.log('📥 materialId JSON:', JSON.stringify(createOrderDto.materialId));
    
    // Check if the DTO has the correct properties
    const dtoAsAny = createOrderDto as any;
    console.log('📥 Via any - materialId:', dtoAsAny.materialId);
    console.log('📥 Via any - destinationSiteId:', dtoAsAny.destinationSiteId);
    console.log('📥 Via any - supplierId:', dtoAsAny.supplierId);
    
    try {
      const result = await this.ordersService.createOrder(createOrderDto, userId);
      console.log('✅ Commande créée avec succès:', result._id);
      return result;
    } catch (error: any) {
      console.error('❌ Erreur dans controller:', error.message);
      console.error('❌ Stack:', error.stack);
      throw error;
    }
  }

  @Get()
  async getAllOrders(
    @Query('status') status?: string,
    @Query('siteId') siteId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.ordersService.getAllOrders({ status, siteId, supplierId });
  }

  @Get('active')
  async getActiveOrders() {
    return this.ordersService.getActiveOrders();
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateDto);
  }

  @Put(':id/progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @Param('id') id: string,
    @Body() body: { currentPosition: { lat: number; lng: number } },
  ) {
    return this.ordersService.updateOrderProgress(id, body.currentPosition);
  }

  @Post(':id/simulate')
  @HttpCode(HttpStatus.OK)
  async simulateDelivery(@Param('id') id: string) {
    return this.ordersService.simulateDelivery(id);
  }
}