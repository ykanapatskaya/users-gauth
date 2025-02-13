import { Response, Request } from 'express';
import { Repository } from 'typeorm';
import { TokenExpiredError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validate(req: Request, res: Response) {
    try {
      return await this.verifyAccessToken(req);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        await this.rotateTokens(req, res); 
      }

      throw error;
    }
  }

  async rotateTokens(req: Request, res: Response): Promise<User>  {
    const oldRefreshToken = req.cookies['refresh-token'];

    if (!oldRefreshToken) {
      throw new Error('No refresh token');
    }

    try {
      const user = await this.validateRefreshToken(req);
      await this.generateUserTokens(user.id, res);
      await this.revokeRefreshToken(oldRefreshToken, 'rotated');

      return user;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new Error('Error generating tokens');
    }
  }

  async verifyAccessToken(req: Request): Promise<User> {
    try {
      const accessToken = req.cookies['access-token'];
      
      if (!accessToken) {
        throw new UnauthorizedException('No access token');
      }
      
      const { sub: userId } = this.jwtService.verify(accessToken, {
        secret: this.configService.get('JWT_SECRET')
      });
      const user = await this.userRepository.findOne({ where: { id: userId } });

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token: ', error);     
    }
  }

  async validateRefreshToken(request: Request): Promise<User> {
    const token = request.cookies['refresh-token'];

    console.log('@ validateRefreshToken', token)

    if (!token) {
      throw new Error('No Refresh Tokens');
    }

    try {
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token },
      });
      
      if (!refreshToken?.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userRepository.findOne({ where: { id: refreshToken.userId } });

      if (!user) {
        throw new UnauthorizedException('Not found user');
      }

      if (user.isBlocked) {
        throw new UnauthorizedException('Account is blocked');
      }

      if (refreshToken.isRevoked) {
        // Potential reuse attack
        refreshToken.reusedCount += 1;

        await this.refreshTokenRepository.save(refreshToken);
        
        if (refreshToken.reusedCount >= 5) { // TODO: 3
          // TODO: userRepository.block(userId)
          user.isBlocked = true;
          await this.userRepository.save(user);
          this.logger.warn(`Blocked user ${user.id} due to refresh token reuse`);
        }
        
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (new Date() > refreshToken.expiresAt) {
        await this.revokeRefreshToken(refreshToken.token, 'expired');
        throw new UnauthorizedException('Refresh token has expired');
      }

      return user;
    } catch (error) {
      this.logger.error(`Refresh token validation failed: ${error.message}`);
      throw error;
    }
  }

  async generateUserTokens(userId: string, response: Response) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      
      await this.saveAccessToken(accessToken, response);
      await this.saveRefreshToken(refreshToken, user.id, response);

      return user;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new Error('Error generating tokens');
    }
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('ACCEESS_TOKEN_EXP_DUR'),
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXP_DUR'),
    });
  }

  private async saveAccessToken(accessToken: string, res: Response) {
    try {
      res.cookie('access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: this.parseExpirationToMs(this.configService.get('ACCEESS_TOKEN_EXP_DUR')),
      });
    } catch (error) {
      throw error;
    }
  }

  private async saveRefreshToken(refreshToken: string, userId: string, res: Response): Promise<RefreshToken> {
    const tokenExperation = this.configService.get('REFRESH_TOKEN_EXP_DUR');
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.parseExpirationToMs(tokenExperation));
    const maxAge = this.parseExpirationToMs(this.configService.get('REFRESH_TOKEN_EXP_DUR'));

    try {
      const newRefreshToken = await this.refreshTokenRepository.create({
        token: refreshToken,
        userId,
        expiresAt,
        isRevoked: false,
        reusedCount: 0,
      });

      await this.refreshTokenRepository.save(newRefreshToken);

      res.cookie('refresh-token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge,
      });

      return newRefreshToken;
    } catch (e) {
      throw e;
    }
  }

  private parseExpirationToMs(expiration: string): number {
    const match = expiration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) throw new Error(`Invalid expiration format: ${expiration}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    
    return value * multipliers[unit];
  }

  clearAccessCookies(res: Response) {
    res.clearCookie('access-token');
  }

  clearRefreshCookies(res: Response) {
    res.clearCookie('refresh-token');
  }

  clearCookies(res: Response) {
    try {
      this.clearAccessCookies(res);
      this.clearRefreshCookies(res)
    } catch (error) {
      throw error;
    }
  }

  async revokeRefreshToken(token: string, reason: string) {
    try {
      await this.refreshTokenRepository.update(
        { token },
        {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      );
    } catch (error) {
      //this.logger.error(`Failed to revoke refresh token: ${error.message}`);
      throw new Error('Error revoking refresh token');
    }
  }
}
