import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotConversation, ChatbotConversationSchema } from './entities';
import { UsersModule } from 'src/users/users.module';
import { TeamsModule } from 'src/teams/teams.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ChatbotConversation.name, schema: ChatbotConversationSchema },
    ]),
    UsersModule,
    TeamsModule,
    RolesModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
