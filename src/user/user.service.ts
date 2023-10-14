import { Injectable } from '@nestjs/common';
import { User } from './user.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRequest } from 'src/auth/user-req.interface';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(userReq: UserRequest) {
    const user = new this.userModel(userReq);
    await user.save();
  }
}
