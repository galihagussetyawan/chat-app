import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room/room.service';

interface Event<T> {
  roomId: string;
  data: T;
}

interface EventMessage {
  id: string;
  type: string;
  to: string;
  from: string;
  timestamp: Date;
  body: string;
}

interface EventJoin {
  roomId: string;
}

@WebSocketGateway()
export class AppGateway {
  constructor(private readonly roomService: RoomService) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage('message')
  async handleMessageEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Event<EventMessage>,
  ) {
    client.broadcast.to(payload.roomId).emit('message', payload);
  }

  @SubscribeMessage('join')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EventJoin,
  ) {
    //dummy user data
    await this.roomService.addUserToRoom(payload.roomId, {
      userId: 'asdasd',
      socketId: client.id,
    });
    await this.server.in(client.id).socketsJoin(payload.roomId);

    // broadcast notify when user join to the group
    await client.broadcast
      .to(payload.roomId)
      .emit('message', client.id + ' has join the group');
  }
}
