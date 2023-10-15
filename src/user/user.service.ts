import { Injectable } from '@nestjs/common';
import { User } from './user.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRequest } from 'src/auth/user-req.interface';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly sessionService: SessionService,
  ) {}

  async createUser(userReq: UserRequest) {
    const user = new this.userModel(userReq);
    await user.save();

    await this.sessionService.createSession(user);
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email });
  }
}
