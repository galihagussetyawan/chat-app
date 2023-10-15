import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { AppGateway } from './app.gateway';
import { RoomService } from './room/room.service';
import { JwtService } from '@nestjs/jwt';
import { MessageModule } from './message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV && '.env.dev',
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UserModule,
    AuthModule,
    RoomModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway, RoomService, JwtService],
})
export class AppModule {}
