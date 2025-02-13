import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenService } from './tokens.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, User]),
  ],
  controllers: [],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
