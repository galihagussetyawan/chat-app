import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Message } from 'src/message/message.model';
import { User } from 'src/user/user.model';

@Schema()
export class Room extends Document {
  @Prop({ unique: true })
  name: string;

  // The type here defines whether the room is a group message or a private message
  @Prop()
  type: string;

  @Prop({ type: [Types.ObjectId], ref: Message.name })
  messages: Message[];

  @Prop({ type: [Types.ObjectId], ref: User.name })
  participants: User[];

  @Prop()
  createdAt: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
