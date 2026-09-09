import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { HashUtil } from "../../common/utils/hash.util";
import { OtpUtil } from "../../common/utils/otp.util";
import { Role, UserStatus } from "@prisma/client";
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private generateTokens(user: {
    id: string;
    email?: string | null;
    phone: string;
    role: Role;
  }) {
    const payload = {
      sub: user.id,
      email: user.email || undefined,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        "jwt.secret",
        "super-secret-access-key-change-in-production-32chars",
      ),
      expiresIn: (this.configService.get<string>("jwt.expiresIn") || "15m") as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        "jwt.refreshSecret",
        "super-secret-refresh-key-change-in-production-32chars",
      ),
      expiresIn: (this.configService.get<string>("jwt.refreshExpiresIn") || "7d") as any,
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const phoneClean = dto.phone.trim();
    const emailClean = dto.email ? dto.email.toLowerCase().trim() : null;

    // Check if existing user with phone or email
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: phoneClean },
          ...(emailClean ? [{ email: emailClean }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.phone === phoneClean) {
        throw new ConflictException("A user with this phone number already exists");
      }
      throw new ConflictException("A user with this email address already exists");
    }

    const hashedPassword = await HashUtil.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: emailClean,
        phone: phoneClean,
        passwordHash: hashedPassword,
        role: Role.CUSTOMER,
        status: UserStatus.PENDING_VERIFICATION,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate numeric OTP code
    const otp = OtpUtil.generateNumericOtp(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpToken.create({
      data: {
        identifier: phoneClean,
        code: otp,
        expiresAt,
        userId: user.id,
      },
    });

    this.logger.log(`[VERIFICATION OTP] Sent to ${phoneClean}: ${otp}`);

    if (emailClean) {
      void this.mailService.sendEmailVerificationOtp(
        emailClean,
        user.fullName,
        otp,
      );
    }

    return {
      userId: user.id,
      verificationExpiresInSeconds: 300,
      otpDebug: process.env.NODE_ENV !== "production" ? otp : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const identifier = dto.phone?.trim() || dto.userId;

    const otpRecord = await this.prisma.otpToken.findFirst({
      where: {
        code: dto.otp.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() },
        OR: [
          ...(dto.phone ? [{ identifier: dto.phone.trim() }] : []),
          ...(dto.userId ? [{ userId: dto.userId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new BadRequestException("Invalid or expired OTP code");
    }

    await this.prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const user = await this.prisma.user.update({
      where: { id: otpRecord.userId || undefined },
      data: { status: UserStatus.ACTIVE },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    const tokens = this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const identifier = dto.identifier.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier.toLowerCase() },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(`Account is currently ${user.status.toLowerCase()}`);
    }

    const isPasswordValid = await HashUtil.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = this.generateTokens(user);

    const tokenHash = await HashUtil.hash(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        device: userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
      },
    };
  }

  async refreshToken(refreshToken: string, ipAddress?: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          "jwt.refreshSecret",
          "super-secret-refresh-key-change-in-production-32chars",
        ),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException("Invalid refresh token or inactive account");
      }

      const newTokens = this.generateTokens(user);
      const tokenHash = await HashUtil.hash(newTokens.refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.prisma.refreshToken.create({
        data: {
          tokenHash,
          userId: user.id,
          ipAddress,
          expiresAt,
        },
      });

      return newTokens;
    } catch {
      throw new UnauthorizedException("Refresh token is expired or invalid");
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { message: "Logged out successfully" };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        addresses: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    return user;
  }
}
