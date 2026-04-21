import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  SendVoiceMessageDto,
  SendLocationDto,
  JoinRoomDto,
  TypingDto,
  MarkAsReadDto,
} from './dto/chat.dto';
import { MessageType } from './entities/chat-message.entity';

interface ChatRoom {
  orderId: string;
  participants: Map<string, { name: string; role: string; socketId: string }>;
  messages: any[];
  unreadCount: Map<string, number>;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(ChatGateway.name);
  private rooms: Map<string, ChatRoom> = new Map();
  private userSockets: Map<string, { socketId: string; userId: string; role: string }> = new Map();

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to chat service', createdAt: new Date().toISOString() });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove user from all rooms
    for (const [userId, data] of this.userSockets.entries()) {
      if (data.socketId === client.id) {
        this.userSockets.delete(userId);

        // Notify rooms that user left
        for (const [orderId, room] of this.rooms.entries()) {
          if (room.participants.has(userId)) {
            room.participants.delete(userId);
            this.server.to(`order-${orderId}`).emit('userLeft', {
              userId,
              userName: data.userId,
              createdAt: new Date().toISOString(),
            });
          }
        }
        break;
      }
    }
  }

  @SubscribeMessage('joinRoom')
  @UsePipes(new ValidationPipe())
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    const roomId = `order-${data.orderId}`;
    client.join(roomId);

    // Store user socket
    this.userSockets.set(data.userId, {
      socketId: client.id,
      userId: data.userId,
      role: data.role,
    });

    // Initialize or update room
    let room = this.rooms.get(data.orderId);
    if (!room) {
      room = {
        orderId: data.orderId,
        participants: new Map(),
        messages: [],
        unreadCount: new Map(),
      };
      this.rooms.set(data.orderId, room);
    }

    room.participants.set(data.userId, {
      name: data.userName,
      role: data.role,
      socketId: client.id,
    });

    // Load last 50 messages from database
    const lastMessages = await this.chatService.getMessages(data.orderId, 50);
    if (lastMessages.length > 0) {
      client.emit('messageHistory', lastMessages);
    }

    // Notify room
    client.to(roomId).emit('userJoined', {
      userId: data.userId,
      userName: data.userName,
      role: data.role,
      createdAt: new Date().toISOString(),
    });

    client.emit('joinedRoom', {
      roomId,
      orderId: data.orderId,
      participants: Array.from(room.participants.values()),
    });

    this.logger.log(`User ${data.userName} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string },
  ) {
    const roomId = `order-${data.orderId}`;
    client.leave(roomId);

    const room = this.rooms.get(data.orderId);
    if (room) {
      room.participants.delete(data.userId);
      this.server.to(roomId).emit('userLeft', {
        userId: data.userId,
        createdAt: new Date().toISOString(),
      });
    }

    this.logger.log(`User ${data.userId} left room ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  @UsePipes(new ValidationPipe())
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    const message = {
      id: uuidv4(),
      orderId: data.orderId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: data.content,
      type: data.type || MessageType.TEXT,
      createdAt: new Date().toISOString(), // ✅ CORRIGÉ: timestamp → createdAt (string ISO)
    };

    // Save to database
    await this.chatService.saveMessage(message);

    // Store in memory
    const room = this.rooms.get(data.orderId);
    if (room) {
      room.messages.push(message);
      if (room.messages.length > 200) room.messages.shift();

      // Increment unread count for other participants
      for (const [userId] of room.participants) {
        if (userId !== data.senderId) {
          const currentUnread = room.unreadCount.get(userId) || 0;
          room.unreadCount.set(userId, currentUnread + 1);
        }
      }
    }

    const roomId = `order-${data.orderId}`;
    this.server.to(roomId).emit('newMessage', message);
    this.logger.log(`Message sent to room ${roomId}: ${data.content.substring(0, 50)}`);
  }

  @SubscribeMessage('sendVoiceMessage')
  @UsePipes(new ValidationPipe())
  async handleSendVoiceMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendVoiceMessageDto,
  ) {
    // In production, save audio to cloud storage (S3, etc.)
    const audioUrl = `/uploads/voice/${Date.now()}-${data.senderId}.webm`;

    const message = {
      id: uuidv4(),
      orderId: data.orderId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: `🎤 Message vocal (${data.duration}s)`,
      type: MessageType.VOICE,
      fileUrl: audioUrl,
      duration: data.duration,
      createdAt: new Date().toISOString(), // ✅ CORRIGÉ: timestamp → createdAt (string ISO)
    };

    await this.chatService.saveMessage(message);

    const roomId = `order-${data.orderId}`;
    this.server.to(roomId).emit('newMessage', message);
    this.logger.log(`Voice message sent to room ${roomId}`);
  }

  @SubscribeMessage('sendLocation')
  @UsePipes(new ValidationPipe())
  async handleSendLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendLocationDto,
  ) {
    const message = {
      id: uuidv4(),
      orderId: data.orderId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: `📍 ${data.location.address || 'Position actuelle'}`,
      type: MessageType.LOCATION,
      location: data.location,
      createdAt: new Date().toISOString(), // ✅ CORRIGÉ: timestamp → createdAt (string ISO)
    };

    await this.chatService.saveMessage(message);

    const roomId = `order-${data.orderId}`;
    this.server.to(roomId).emit('newMessage', message);
    this.server.to(roomId).emit('locationUpdate', {
      orderId: data.orderId,
      location: data.location,
      senderName: data.senderName,
      timestamp: new Date().toISOString(), // ← gardé car LocationUpdateData utilise timestamp
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingDto,
  ) {
    const roomId = `order-${data.orderId}`;
    client.to(roomId).emit('userTyping', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: MarkAsReadDto,
  ) {
    await this.chatService.markAsRead(data.orderId, data.userId);

    const room = this.rooms.get(data.orderId);
    if (room) {
      room.unreadCount.delete(data.userId);
      const roomId = `order-${data.orderId}`;
      this.server.to(roomId).emit('messagesRead', {
        orderId: data.orderId,
        userId: data.userId,
        createdAt: new Date().toISOString(), // ✅ CORRIGÉ: timestamp → createdAt
      });
    }
  }

  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string },
  ) {
    const unreadCount = await this.chatService.getUnreadCount(data.orderId, data.userId);
    client.emit('unreadCount', { orderId: data.orderId, count: unreadCount });
  }

  // Method to emit delivery progress from OrdersService
  emitDeliveryProgress(orderId: string, progress: number, location: { lat: number; lng: number }) {
    const roomId = `order-${orderId}`;
    this.server.to(roomId).emit('deliveryProgress', {
      orderId,
      progress,
      location,
      timestamp: new Date().toISOString(), // ← gardé car DeliveryProgressData utilise timestamp
    });
  }

  // Method to emit arrival notification
  emitArrival(orderId: string, supplierName: string) {
    const roomId = `order-${orderId}`;
    this.server.to(roomId).emit('arrivalNotification', {
      orderId,
      supplierName,
      message: `🚚 Le camion est arrivé chez ${supplierName}`,
      timestamp: new Date().toISOString(),
    });
  }

  getRoom(orderId: string): ChatRoom | undefined {
    return this.rooms.get(orderId);
  }
}
