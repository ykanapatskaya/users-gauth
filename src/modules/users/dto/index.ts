import { IsEmail, IsString, IsOptional, IsUrl, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  googleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  pictureUrl?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  pictureUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  lastLoginAt?: Date
}
