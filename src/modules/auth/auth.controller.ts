import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyOtpDto,
} from "./dto/auth.dto";

@ApiTags("Authentication")
@Controller("auth")
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new customer account" })
  @ApiResponse({ status: 201, description: "OTP verification code sent" })
  @ResponseMessage("OTP verification code sent to phone number.")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify registration OTP code" })
  @ResponseMessage("Account verified successfully.")
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with phone/email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ResponseMessage("Login successful.")
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ResponseMessage("Token refreshed successfully")
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.refreshToken(dto.refreshToken, ipAddress);
  }

  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ResponseMessage("User profile retrieved")
  async getProfile(@CurrentUser("id") userId: string) {
    return this.authService.getProfile(userId);
  }

  @ApiBearerAuth()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout and revoke active session" })
  @ResponseMessage("Logged out successfully")
  async logout(@CurrentUser("id") userId: string) {
    return this.authService.logout(userId);
  }
}
