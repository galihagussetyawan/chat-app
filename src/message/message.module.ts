import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './message.model';
import { User, UserSchema } from 'src/user/user.model';
import { MessageService } from './message.service';
import { Room, RoomSchema } from 'src/room/room.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  providers: [MessageService],
  exports: [MongooseModule],
})
export class MessageModule {}
