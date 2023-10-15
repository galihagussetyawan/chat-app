import { Module, Session } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionSchema } from './session.model';
import { User, UserSchema } from 'src/user/user.model';
import { Room, RoomSchema } from 'src/room/room.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
})
export class SessionModule {}
