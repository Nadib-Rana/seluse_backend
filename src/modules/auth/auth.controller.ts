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
import { Request, Response } from "express";
import { Res } from "@nestjs/common";
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
  ResetPasswordDto,
} from "./dto/auth.dto";

@ApiTags("Authentication")
@Controller("auth")
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshTokenCookie(res: Response, refreshToken?: string) {
    if (!refreshToken) return;
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("selusbd_refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

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
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with phone/email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ResponseMessage("Login successful.")
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");
    const result = await this.authService.login(dto, ipAddress, userAgent);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ResponseMessage("Token refreshed successfully")
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const token = dto?.refreshToken || req.cookies?.selusbd_refresh_token;
    const result = await this.authService.refreshToken(token, ipAddress);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset OTP code via phone or email" })
  @ResponseMessage("Password reset OTP sent.")
  async forgotPassword(@Body() dto: { identifier: string }) {
    return this.authService.forgotPassword(dto.identifier);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password using OTP verification code" })
  @ResponseMessage("Password reset successfully.")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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
  async logout(
    @CurrentUser("id") userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie("selusbd_refresh_token", { path: "/api/v1/auth" });
    return this.authService.logout(userId);
  }
}
