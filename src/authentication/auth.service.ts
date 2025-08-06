import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/user.dto';
import { User } from '../users/user.entity';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(phone: string, password: string): Promise<User> {
    const user = await this.userService.findOne(phone);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(phone: string, password: string) {
    const user = await this.validateUser(phone, password);
    const payload = { sub: user.id, phone: user.phone };
    const token = await this.jwtService.signAsync(payload);
    return {
      access_token: token,
      user,
    };
  }

  async signup(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      const user = await this.userService.createUser({
        ...createUserDto,
        password: hashedPassword,
      });
      const payload = { sub: user.id, phone: user.phone };
      const token = await this.jwtService.signAsync(payload);
      return {
        access_token: token,
        user,
      };
    } catch (error) {
      // PostgreSQL unique violation error code is '23505'
      if (error.code === '23505') {
        console.error('Numéro de téléphone déjà utilisé');
        throw new ConflictException('Numéro de téléphone déjà utilisé');
      }
      throw error;
    }
  }
}