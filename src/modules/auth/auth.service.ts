import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { TokenService } from '../tokens/tokens.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private oauth2Client: OAuth2Client;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'postmessage' // Special value for @react-oauth/google
    );
  }

  async googleAuthCallback(code: string, req: Request, res: Response) {
    try {
      const googleProfile = await this.getGoogleProfileByCode(code);
      const user = await this.usersService.findOrCreateUser(googleProfile);
      
      await this.usersService.updateLastLogin(user.id)
      await this.tokenService.generateUserTokens(user.id, res);
      
      return res.json({ success: true, user });
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed' 
      });
    }
  }

  private async getGoogleProfileByCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
      
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    const user = {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
      googleId: payload.sub,
    };

    return user;
  }

  async signout(userId: string, res: Response) {
    try {
      res.clearCookie('access-token');
      res.clearCookie('refresh-token');

      return res.json({ success: true })
    } catch (error) {
      throw error;
    }
  }
}
