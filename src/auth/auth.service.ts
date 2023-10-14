import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { UserRequest } from './user-req.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

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

  async signin(userReq: UserRequest) {
    const isExistUser = await this.userService.getUserByEmail(userReq.email);
    if (!isExistUser) {
      throw new BadRequestException(`Email '${userReq.email}' not registered`);
    }

    const checkIsMatch = await bcrypt.compare(
      userReq.password,
      isExistUser.password,
    );
    if (!checkIsMatch) {
      throw new BadRequestException('Password incorrect');
    }

    return this.getAuthPayload(isExistUser?.id);
  }

  async createJwtToken(userId: string) {
    return this.jwtService.sign(
      {
        sub: userId,
      },
      {
        secret: process.env.JWT_SECRET_TOKEN,
        expiresIn: `${3 * 30}d`,
      },
    );
  }

  async getAuthPayload(userId: string) {
    return {
      id: userId,
      access_token: await this.createJwtToken(userId),
    };
  }
}
