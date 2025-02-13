import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    return this.usersRepository.create(data);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.validateUser(id);
    
    return this.usersRepository.update(user.id, data);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.validateUser(id);

    await this.usersRepository.delete(id);
  }

  async findById(id: string): Promise<User> {
    return this.usersRepository.findById(id);
  }

  async findByGoogleId(googleId: string): Promise<User> {
    return this.usersRepository.findByGoogleId(googleId);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async validateUser(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    return user;
  }

  async findOrCreateUser(profile: any): Promise<User> {
    try {
      let user = await this.usersRepository.findByEmail(profile.email);
      
      if (!user) {
        return this.usersRepository.create(profile);
      }

      if (user.isBlocked) {
        throw new UnauthorizedException('Token revoked');
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }
}
