import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/user.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  private pendingSignups = new Map<string, { dto: CreateUserDto; otp: string; expires: Date }>();

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
    // Vérifie si un utilisateur existe déjà avec ce numéro
    try {
      await this.userService.findOne(createUserDto.phone);
      throw new ConflictException('Numéro de téléphone déjà utilisé');
    } catch (err) {
      // Si NotFoundException, c'est bon, on continue
      if (!(err instanceof NotFoundException)) throw err;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    this.pendingSignups.set(createUserDto.phone, { dto: createUserDto, otp, expires });
    // Envoie l’OTP par SMS ici
    console.log(`OTP pour ${createUserDto.phone} : ${otp}`);
    return { message: 'Vérifiez votre téléphone pour le code OTP.' };
  }

  async verifyOtp(phone: string, otp: string) {
    const pending = this.pendingSignups.get(phone);
    if (!pending || pending.otp !== otp || pending.expires < new Date()) {
      throw new UnauthorizedException('OTP invalide ou expiré');
    }
    // Crée l’utilisateur en base
    const hashedPassword = await bcrypt.hash(pending.dto.password, 10);
    let user: User;
    try {
      user = await this.userService.createUser({
        ...pending.dto,
        password: hashedPassword,
      });
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Numéro de téléphone déjà utilisé');
      }
      throw error;
    }
    this.pendingSignups.delete(phone);
    const payload = { sub: user.id, phone: user.phone };
    const token = await this.jwtService.signAsync(payload);
    return { access_token: token, user };
  }

  async resendOtp(phone: string) {
  const pending = this.pendingSignups.get(phone);
  if (!pending) {
    throw new UnauthorizedException('Aucune inscription en attente pour ce numéro');
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  pending.otp = otp;
  pending.expires = expires;
  this.pendingSignups.set(phone, pending);
  // Envoie l’OTP par SMS ici
  console.log(`Nouvel OTP pour ${phone} : ${otp}`);
  return { message: 'Nouveau code OTP envoyé.' };
}
}