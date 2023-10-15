import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/user.model';
import { JwtService } from '@nestjs/jwt';
import { WebsocketAuthGuard } from './websocket.guard';
import { SessionService } from 'src/session/session.service';
import { Session, SessionSchema } from 'src/session/session.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  providers: [
    AuthService,
    UserService,
    WebsocketAuthGuard,
    JwtService,
    SessionService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
