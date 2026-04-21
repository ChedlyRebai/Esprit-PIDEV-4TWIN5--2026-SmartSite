import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {
    this.logger.log('✅ ChatController initialisé');
  }

  @Get('health')
  async healthCheck() {
    return { success: true, message: 'Chat service is running', timestamp: new Date() };
  }

  @Get('messages/:orderId')
  async getMessages(@Param('orderId') orderId: string, @Query('limit') limit?: string) {
    try {
      const messages = await this.chatService.getMessages(orderId, limit ? parseInt(limit) : 50);
      return { success: true, messages };
    } catch (error) {
      return { success: false, messages: [], error: error.message };
    }
  }

  @Post('messages')
  async sendMessage(@Body() body: { 
    orderId: string; 
    senderType: string; 
    content: string; 
    type?: string;
    location?: { lat: number; lng: number; address?: string };
  }) {
    try {
      let senderId, senderName, senderRole;
      if (body.senderType === 'site') {
        senderId = 'site-user';
        senderName = 'Chantier';
        senderRole = 'site';
      } else if (body.senderType === 'supplier') {
        senderId = 'supplier-user';
        senderName = 'Fournisseur';
        senderRole = 'supplier';
      } else {
        senderId = 'system-user';
        senderName = 'Système';
        senderRole = 'system';
      }
      
      const message = {
        id: uuidv4(),
        orderId: body.orderId,
        senderId,
        senderName,
        senderRole,
        content: body.content,
        type: body.type || 'text',
        location: body.location,
        createdAt: new Date(),
        readBy: [],
      };
      
      const saved = await this.chatService.saveMessage(message);
      return { success: true, message: saved };
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @Get('unread/:orderId/:userType')
  async getUnreadCount(@Param('orderId') orderId: string, @Param('userType') userType: string) {
    try {
      const userId = userType === 'site' ? 'site-user' : 'supplier-user';
      const count = await this.chatService.getUnreadCount(orderId, userId);
      return { success: true, count };
    } catch (error) {
      return { success: false, count: 0 };
    }
  }

  @Post('messages/read')
  async markAsRead(@Body() body: { orderId: string; userId: string; userType: string }) {
    try {
      const userId = body.userType === 'site' ? 'site-user' : 'supplier-user';
      await this.chatService.markAsRead(body.orderId, userId);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/chat',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${uuidv4()}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: { orderId: string; senderType: string }) {
    try {
      if (!file) return { success: false, error: 'No file' };
      
      const fileUrl = `/uploads/chat/${file.filename}`;
      let fileType = 'document';
      if (file.mimetype.startsWith('image/')) fileType = 'image';
      else if (file.mimetype.startsWith('video/')) fileType = 'video';
      
      let senderId, senderName, senderRole;
      if (body.senderType === 'site') {
        senderId = 'site-user';
        senderName = 'Chantier';
        senderRole = 'site';
      } else {
        senderId = 'supplier-user';
        senderName = 'Fournisseur';
        senderRole = 'supplier';
      }
      
      const message = {
        id: uuidv4(),
        orderId: body.orderId,
        senderId,
        senderName,
        senderRole,
        content: `📎 ${file.originalname}`,
        type: fileType,
        fileUrl,
        metadata: { fileName: file.originalname, fileSize: file.size, fileUrl },
        createdAt: new Date(),
        readBy: [],
      };
      
      const saved = await this.chatService.saveMessage(message);
      return { success: true, message: saved, fileUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('upload-voice')
  @UseInterceptors(FileInterceptor('audio', {
    storage: diskStorage({
      destination: './uploads/voice',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${uuidv4()}.webm`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadVoice(@UploadedFile() file: Express.Multer.File, @Body() body: { orderId: string; senderType: string; duration: string }) {
    try {
      if (!file) return { success: false, error: 'No audio' };
      
      const audioUrl = `/uploads/voice/${file.filename}`;
      const duration = parseInt(body.duration) || 0;
      
      let senderId, senderName, senderRole;
      if (body.senderType === 'site') {
        senderId = 'site-user';
        senderName = 'Chantier';
        senderRole = 'site';
      } else {
        senderId = 'supplier-user';
        senderName = 'Fournisseur';
        senderRole = 'supplier';
      }
      
      const message = {
        id: uuidv4(),
        orderId: body.orderId,
        senderId,
        senderName,
        senderRole,
        content: `🎤 Message vocal (${duration}s)`,
        type: 'voice',
        fileUrl: audioUrl,
        duration,
        metadata: { audioUrl, duration },
        createdAt: new Date(),
        readBy: [],
      };
      
      const saved = await this.chatService.saveMessage(message);
      return { success: true, message: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('location')
  async shareLocation(@Body() body: { orderId: string; senderType: string; location: any }) {
    try {
      let senderId, senderName, senderRole;
      if (body.senderType === 'site') {
        senderId = 'site-user';
        senderName = 'Chantier';
        senderRole = 'site';
      } else {
        senderId = 'supplier-user';
        senderName = 'Fournisseur';
        senderRole = 'supplier';
      }
      
      const message = {
        id: uuidv4(),
        orderId: body.orderId,
        senderId,
        senderName,
        senderRole,
        content: `📍 ${body.location.address || 'Position actuelle'}`,
        type: 'location',
        location: body.location,
        createdAt: new Date(),
        readBy: [],
      };
      
      const saved = await this.chatService.saveMessage(message);
      return { success: true, message: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('arrival-confirmation')
  async sendArrivalConfirmation(@Body() body: { orderId: string }) {
    try {
      const message = {
        id: uuidv4(),
        orderId: body.orderId,
        senderId: 'system-user',
        senderName: 'Système',
        senderRole: 'system',
        content: '✅ Confirmation d\'arrivée - Le camion est arrivé chez le fournisseur',
        type: 'arrival_confirmation',
        createdAt: new Date(),
        readBy: [],
      };
      
      const saved = await this.chatService.saveMessage(message);
      return { success: true, message: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}