import { Request } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext,
  UnauthorizedException
 } from '@nestjs/common';
import { TokenService } from '../../modules/tokens/tokens.service';

@Injectable()
export class JWTAuthGuard implements CanActivate {
  constructor(
   private tokenService: TokenService,
 ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    try {
      const user = await this.tokenService.verifyAccessToken(request);
      request.user = user;
      return;
    } catch (error) {
      if (true/*error instanceof TokenExpiredError*/) {
        console.log('- TokenExpiredError canActivate error:', error); 
        try {
          await this.tokenService.rotateTokens(request, response); 
          return;
        } catch (error) {
          throw error;
        }
      }
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid token');
    }

    if (err || !user) {
      throw new UnauthorizedException(err?.message || 'Unauthorized');
    }

    return user;
  }
}
 