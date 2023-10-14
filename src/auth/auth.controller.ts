import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserRequest } from './user-req.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async registerUser(@Body() userReq: UserRequest, @Res() res: Response) {
    try {
      res.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        message: 'success create account',
        data: await this.authService.registerUser(userReq),
      });
    } catch (error) {
      res.status(error?.status).send({
        status: error?.status,
        message: error?.message,
      });
    }
  }
}
