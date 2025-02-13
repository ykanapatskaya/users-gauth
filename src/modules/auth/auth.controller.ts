import { Request, Response } from 'express';
import { 
  Controller, 
  Post, 
  UseGuards, 
  Req, 
  Res, 
  Body,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JWTAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
  ) {}

  @Post('google/callback')
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  @ApiResponse({ status: 301, description: 'Redirects to frontend with tokens' })
  async googleAuthCallback(
    @Body('code') code: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.googleAuthCallback(code, req, res);
  }

  @Post('signout')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Error during logout' })
  async logout(@GetUser() userId, @Res({ passthrough: true }) res: Response) {
    await this.authService.signout(userId, res);
  } 
}
