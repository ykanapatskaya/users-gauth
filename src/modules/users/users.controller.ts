import { Controller, Get, Req, Res, Put, Body, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JWTAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { TokenService } from '../tokens/tokens.service'
import { UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  @UseGuards(JWTAuthGuard)
  @Get('me')
  async getProfile(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return req.user; // ?? res.user. USER to receive from JWTAuth
  }

  @UseGuards(JWTAuthGuard)
  @Put('profile')
  updateProfile(
    @GetUser('id') userId: string,
    @Body() data: UpdateUserDto,
  ) {
    return this.usersService.updateUser(userId, data);
  }
}