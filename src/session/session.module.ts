import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './session.model';
import { User, UserSchema } from 'src/user/user.model';
import { Room, RoomSchema } from 'src/room/room.model';
import { SessionService } from './session.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  providers: [SessionService],
  exports: [MongooseModule, SessionService],
})
export class SessionModule {}
