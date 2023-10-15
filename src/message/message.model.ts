import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/user.model';

@Schema()
export class Message extends Document {
  @Prop({ type: User })
  to: User;

  @Prop({ type: Types.ObjectId, ref: User.name })
  from: User;

  @Prop()
  type: string;

  @Prop()
  content: string;

  @Prop()
  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
