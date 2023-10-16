import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Room } from './room.model';
import { Model } from 'mongoose';
import { User } from 'src/user/user.model';
import { WsException } from '@nestjs/websockets';
import { SessionService } from 'src/session/session.service';

interface IUser {
  userId: string;
  socketId: string;
}

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly sessionService: SessionService,
  ) {}

  async createRoom(roomName: string, type: string, user: IUser): Promise<Room> {
    // get user by id
    const resUser = await this.userModel.findById(user.userId);
    if (!resUser) {
      throw new WsException('user not registered');
    }

    const newRoom = new this.roomModel({
      name: roomName,
      type,
      createdAt: new Date(),
    });
    await newRoom.participants.push(resUser);
    await newRoom.save();

    await this.sessionService.addRoomSession(resUser, newRoom);
    return newRoom;
  }

  async addUserToRoom(
    roomName: string,
    type: string,
    user: IUser,
  ): Promise<Room> {
    const resUser = await this.userModel.findById(user.userId);
    const isExistRoomByName = await this.roomModel
      .findOne({ name: roomName })
      .populate('participants');

    if (isExistRoomByName) {
      // check if user already join the room
      const isExistUser = isExistRoomByName?.participants?.find(
        (v) => v.id === user.userId,
      );

      // push user if not joined room
      if (!isExistUser) {
        await isExistRoomByName.participants.push(resUser);
        await isExistRoomByName.save();
      }

      await this.sessionService.addRoomSession(resUser, isExistRoomByName);
      return isExistRoomByName;
    } else {
      return await this.createRoom(roomName, type, user);
    }
  }

  async createPrivateRoom(
    roomId: string,
    from: string,
    to: string,
  ): Promise<string> {
    if (roomId) {
      return roomId;
    } else {
      const sender = await this.userModel.findById(from);
      const recipient = await this.userModel.findById(to);

      if (!sender || !recipient) {
        return;
      }

      const session = await this.sessionService.getPrivateSession(
        sender,
        recipient,
      );

      if (!session) {
        const room = new this.roomModel({
          type: 'private',
          createdAt: new Date(),
        });
        room.participants.push(sender);
        room.participants.push(recipient);
        await room.save();

        await this.sessionService.addRoomSession(sender, room);
        await this.sessionService.addRoomSession(recipient, room);

        return room.id;
      }

      return session;
    }
  }
}
