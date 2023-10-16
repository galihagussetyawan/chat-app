import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session } from './session.model';
import { Model } from 'mongoose';
import { User } from 'src/user/user.model';
import { Room } from 'src/room/room.model';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createSession(user: User) {
    const session = new this.sessionModel({ user });
    await session.save();
    user.session = session.id;
    await user.save();
  }

  async addRoomSession(user: User, room: Room) {
    const session = await this.sessionModel
      .findById(user.session)
      .populate('room');

    const isExistRoom = session.room.find((v) => v.id === room.id);
    if (!isExistRoom) {
      session.room.push(room);
    }

    await session.save();
  }

  async getRoomSessionByUserId(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId);
    const session = await this.sessionModel
      .findById(user.session)
      .populate('room');

    const mapping = session.room.flatMap((v) => v.id);
    return mapping;
  }

  async getPrivateSession(sender: User, reciever: User): Promise<string> {
    const senderSession = await this.sessionModel
      .findById(sender.session)
      .populate({
        path: 'room',
        match: {
          type: 'private',
        },
        populate: {
          path: 'participants',
        },
      });

    const findSession = senderSession.room.find(
      (v) =>
        v.type === 'private' &&
        v.participants.find((p) => p.id === reciever.id),
    );

    return findSession.id;
  }
}
