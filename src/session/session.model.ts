import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Room } from 'src/room/room.model';
import { User } from 'src/user/user.model';

@Schema({ collection: 'sessions' })
export class Session extends Document {
  @Prop({ type: Types.ObjectId, unique: true, ref: User.name })
  user: User;

  @Prop({ type: [Types.ObjectId], ref: Room.name })
  room: Room[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);
