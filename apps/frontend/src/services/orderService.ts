// frontend/src/services/orderService.ts
import axios from 'axios';

// The backend materials service on port 3002 has orders controller at /api/orders
// The vite proxy handles /api/orders -> localhost:3002/api/orders
const API_URL = '/api/orders';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MaterialOrder {
  _id: string;
  orderNumber: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  destinationSiteId: string;
  destinationSiteName: string;
  destinationAddress: string;
  destinationCoordinates: { lat: number; lng: number };
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  supplierCoordinates: { lat: number; lng: number };
  estimatedDurationMinutes: number;
  remainingTimeMinutes: number;
  currentPosition: { lat: number; lng: number };
  progress: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateOrderData {
  materialId: string;
  quantity: number;
  destinationSiteId: string;
  supplierId: string;
  estimatedDurationMinutes: number;
  notes?: string;
}

export const orderService = {
  async createOrder(data: CreateOrderData): Promise<MaterialOrder> {
    try {
      console.log('📤 === FRONTEND orderService.createOrder ===');
      console.log('📤 data:', JSON.stringify(data));
      console.log('📤 materialId:', data.materialId);
      console.log('📤 typeof materialId:', typeof data.materialId);
      console.log('📤 materialId length:', data.materialId?.length);
      const response = await apiClient.post('', data);
      console.log('✅ Order created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur createOrder:', error.message);
      throw error;
    }
  },

  async getAllOrders(filters?: { status?: string; siteId?: string; supplierId?: string }): Promise<MaterialOrder[]> {
    try {
      const response = await apiClient.get('', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Erreur getAllOrders:', error);
      throw error;
    }
  },

  async getActiveOrders(): Promise<MaterialOrder[]> {
    try {
      const response = await apiClient.get('/active');
      return response.data;
    } catch (error) {
      console.error('Erreur getActiveOrders:', error);
      throw error;
    }
  },

  async getOrderById(orderId: string): Promise<MaterialOrder> {
    try {
      const response = await apiClient.get(`/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getOrderById:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, updateData: { status: string; currentPosition?: { lat: number; lng: number; progress?: number } }): Promise<MaterialOrder> {
    try {
      console.log('📤 Updating order status:', orderId, updateData);
      const response = await apiClient.put(`/${orderId}/status`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur updateOrderStatus:', error.message);
      throw error;
    }
  },

  async updateOrderProgress(orderId: string, progressData: { lat: number; lng: number; progress: number }): Promise<MaterialOrder> {
    try {
      const response = await apiClient.put(`/${orderId}/progress`, { currentPosition: { lat: progressData.lat, lng: progressData.lng } });
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur updateOrderProgress:', error.message);
      throw error;
    }
  },

  async simulateDelivery(orderId: string): Promise<MaterialOrder> {
    try {
      const response = await apiClient.post(`/${orderId}/simulate`);
      return response.data;
    } catch (error) {
      console.error('Erreur simulateDelivery:', error);
      throw error;
    }
  },
};

export default orderService;