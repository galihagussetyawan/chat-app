import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.model';
import { SessionService } from 'src/session/session.service';
import { Session, SessionSchema } from 'src/session/session.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  providers: [UserService, SessionService],
  exports: [MongooseModule, UserService],
})
export class UserModule {}
