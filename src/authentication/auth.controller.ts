import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, UserResponseDto } from '../users/user.dto';
import { LoginDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User authenticated with JWT', schema: {
    example: {
      access_token: 'jwt.token.here',
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        phone: '12345',
        createdAt: '2024-08-06T12:00:00.000Z'
      }
    }
  }})
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.phone, body.password);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Signup with phone and password (hashed)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created with JWT', schema: {
  example: {
    access_token: 'jwt.token.here',
    user: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      phone: 33612345678,
      createdAt: '2024-08-06T12:00:00.000Z'
    }
  }
}})
  async signup(@Body() body: CreateUserDto) {
    return this.authService.signup(body);
  }
  @Post('verify-otp')
@ApiOperation({ summary: 'Vérifie le code OTP' })
@ApiBody({ schema: { example: { phone: '33612345678', otp: '123456' } } })
async verifyOtp(@Body() body: { phone: string, otp: string }) {
  return this.authService.verifyOtp(body.phone, body.otp);
}

@Post('resend-otp')
@ApiOperation({ summary: 'Renvoyer un nouveau code OTP' })
@ApiBody({ schema: { example: { phone: '33612345678' } } })
async resendOtp(@Body() body: { phone: string }) {
  return this.authService.resendOtp(body.phone);
}
}