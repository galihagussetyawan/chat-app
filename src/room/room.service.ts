import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Room } from './room.model';
import { Model } from 'mongoose';
import { User } from 'src/user/user.model';
import { WsException } from '@nestjs/websockets';

interface IUser {
  userId: string;
  socketId: string;
}

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createRoom(roomName: string, type: string, user: IUser) {
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
  }

  async addUserToRoom(roomName: string, type: string, user: IUser) {
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
    } else {
      await this.createRoom(roomName, type, user);
    }
  }
}
