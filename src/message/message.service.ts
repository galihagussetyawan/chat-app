import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './message.model';
import { Model } from 'mongoose';
import { EventMessage } from 'src/app.gateway';
import { Room } from 'src/room/room.model';
import { User } from 'src/user/user.model';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async saveMessage(
    roomId: string,
    eventMessage: EventMessage,
  ): Promise<Message> {
    const fromUser = await this.userModel
      .findById(eventMessage.from)
      .select('username firstName lastName');

    const toUser = await this.userModel
      .findById(eventMessage.to)
      .select('username firstName lastName');

    const message = new this.messageModel({
      type: eventMessage.type,
      to: toUser ? toUser : null,
      from: fromUser,
      createdAt: eventMessage.createdAt,
      content: eventMessage.content,
    });

    await message.save();

    const room = await this.roomModel.findById(roomId);
    room.messages.push(message);
    room.save();

    return message;
  }

  async getMessagesByRoomId(roomId: string): Promise<Message[]> {
    const room = await this.roomModel.findById(roomId).populate('messages');
    return room.messages;
  }
}
