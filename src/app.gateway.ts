import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room/room.service';
import { UseGuards } from '@nestjs/common';
import { WebsocketAuthGuard } from './auth/websocket.guard';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from './message/message.service';
import { SessionService } from './session/session.service';

interface Event<T> {
  roomId: string;
  data: T;
}

export interface EventMessage {
  id: string;
  type: string;
  to: string;
  from: string;
  createdAt: Date;
  content: string;
}

interface EventJoin {
  roomId: string;
  type: string;
}

@WebSocketGateway()
@UseGuards(WebsocketAuthGuard)
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly roomService: RoomService,
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
    private readonly sessionService: SessionService,
  ) {}
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    // prevent connection without access token
    try {
      const token = client?.handshake?.headers?.access_token as string;
      if (!token) {
        client.disconnect();
      }

      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_TOKEN,
      });

      if (!payload) {
        client.disconnect();
      }

      // handle auto join when first connecting
      const rooms = await this.sessionService.getRoomSessionByUserId(
        payload.sub,
      );

      // handle view past messages when they join a chat room.
      rooms.forEach(async (v) => {
        client.join(v);

        const messages = await this.messageService.getMessagesByRoomId(v);

        messages.forEach((msg) => {
          client.emit('message', { roomId: v, data: msg });
        });
      });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // throw new Error('Method not implemented.');
    console.log('Disconnected ' + client.id);
  }

  @SubscribeMessage('message')
  @UseGuards(WebsocketAuthGuard)
  async handleMessageEvent(
    @ConnectedSocket() client: any,
    @MessageBody() payload: Event<EventMessage>,
  ) {
    payload.data.from = client.user;
    payload.data.createdAt = new Date();

    const resMessage = await this.messageService.saveMessage(
      payload.roomId,
      payload.data,
    );

    client.emit('message', resMessage);
    client.broadcast.to(payload.roomId).emit('message', resMessage);
  }

  @SubscribeMessage('join')
  @UseGuards(WebsocketAuthGuard)
  async joinRoom(
    @ConnectedSocket() client: any,
    @MessageBody() payload: EventJoin,
  ) {
    //dummy user data
    const resRoom = await this.roomService.addUserToRoom(
      payload.roomId,
      payload.type,
      {
        userId: client.user,
        socketId: client.id,
      },
    );

    // join socket client to room
    await this.server.in(client.id).socketsJoin(resRoom?.id);

    // broadcast notify when user join to the group
    await client.broadcast
      .to(resRoom?.id)
      .emit('message', client.id + ' has join the group: ' + resRoom?.id);
  }
}
