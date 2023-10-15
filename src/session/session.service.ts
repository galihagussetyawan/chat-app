import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session } from './session.model';
import { Model } from 'mongoose';
import { User } from 'src/user/user.model';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async createSession(user: User) {
    const session = new this.sessionModel({ user });
    await session.save();
  }
}
