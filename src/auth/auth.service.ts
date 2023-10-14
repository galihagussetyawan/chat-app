import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { UserRequest } from './user-req.interface';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async registerUser(userReq: UserRequest) {
    if (
      !userReq.email ||
      !userReq.password ||
      userReq.email === '' ||
      userReq.password === ''
    ) {
      throw new BadRequestException('required email and password');
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(userReq.password, salt);
    userReq.password = hashPassword;
    userReq.createdAt = new Date();
    userReq.updatedAt = new Date();

    await this.userService.createUser(userReq);
  }
}
