import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './room.model';
import { User, UserSchema } from 'src/user/user.model';
import { Message, MessageSchema } from 'src/message/message.model';
import { Session, SessionSchema } from 'src/session/session.model';
import { SessionService } from 'src/session/session.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  providers: [RoomService, SessionService],
  exports: [MongooseModule],
})
export class RoomModule {}
