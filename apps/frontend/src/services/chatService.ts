import axios from 'axios';

const API_URL = '/api/chat';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: string;
  createdAt: string;
  fileUrl?: string;
  location?: any;
  duration?: number;
  metadata?: any;
}

class ChatService {
  private apiClient = axios.create({ baseURL: API_URL, timeout: 30000 });

  constructor() {
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getMessagesByOrder(orderId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const { data } = await this.apiClient.get(`/messages/${orderId}?limit=${limit}`);
      if (data.success && data.messages) return data.messages;
      return [];
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  }

  async sendMessage(data: any): Promise<any> {
    try {
      const { data: response } = await this.apiClient.post('/messages', {
        orderId: data.orderId,
        senderType: data.senderType,
        content: data.message,
        type: data.type || 'text',
        location: data.location,
      });
      return response;
    } catch (error) {
      console.error('Send error:', error);
      throw error;
    }
  }

  async uploadFile(orderId: string, senderType: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);
      formData.append('senderType', senderType);

      const { data } = await axios.post(`${API_URL}/upload`, formData);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadVoice(orderId: string, senderType: string, audioBlob: Blob, duration: number): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('orderId', orderId);
      formData.append('senderType', senderType);
      formData.append('duration', duration.toString());

      const { data } = await axios.post(`${API_URL}/upload-voice`, formData);
      return data;
    } catch (error) {
      console.error('Voice upload error:', error);
      throw error;
    }
  }

  async getUnreadCount(orderId: string, userType: string): Promise<number> {
    try {
      const { data } = await this.apiClient.get(`/unread/${orderId}/${userType}`);
      return data.count || 0;
    } catch (error) {
      return 0;
    }
  }

  async markAsRead(orderId: string, userId: string, userType: string): Promise<void> {
    try {
      await this.apiClient.post('/messages/read', { orderId, userId, userType });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }
}

export default new ChatService();