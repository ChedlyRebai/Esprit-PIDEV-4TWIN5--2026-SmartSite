import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, MessageType } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessage>,
  ) {}

  async saveMessage(messageData: any): Promise<any> {
    try {
      const message = new this.chatMessageModel(messageData);
      const saved = await message.save();
      this.logger.log(`✅ Message saved: ${saved._id}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Save error: ${error.message}`);
      throw error;
    }
  }

  async getMessages(orderId: string, limit: number = 50): Promise<any[]> {
    try {
      const messages = await this.chatMessageModel
        .find({ orderId, isDeleted: false })
        .sort({ createdAt: 1 })
        .limit(limit)
        .exec();
      return messages;
    } catch (error) {
      this.logger.error(`❌ Get error: ${error.message}`);
      return [];
    }
  }

  async markAsRead(orderId: string, userId: string): Promise<void> {
    try {
      await this.chatMessageModel.updateMany(
        { orderId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      ).exec();
    } catch (error) {
      this.logger.error(`❌ Mark read error: ${error.message}`);
    }
  }

  async getUnreadCount(orderId: string, userId: string): Promise<number> {
    try {
      return await this.chatMessageModel.countDocuments({
        orderId,
        readBy: { $ne: userId },
        senderId: { $ne: userId },
      }).exec();
    } catch (error) {
      return 0;
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const result = await this.chatMessageModel.updateOne(
        { _id: messageId },
        { isDeleted: true }
      ).exec();
      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }
}