import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Nadib Rana", description: "Full Name" })
  @IsNotEmpty({ message: "Full name is required" })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: "nadib@example.com", description: "User email address" })
  @IsOptional()
  @IsEmail({}, { message: "Please enter a valid email address" })
  email?: string;

  @ApiProperty({ example: "+8801700000000", description: "Phone number" })
  @IsNotEmpty({ message: "Phone number is required" })
  @IsString()
  phone: string;

  @ApiProperty({
    example: "Password123!",
    description: "Password (min 6 characters)",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: "+8801700000000",
    description: "Email or Phone number to login",
  })
  @IsNotEmpty({ message: "Email or Phone is required" })
  @IsString()
  identifier: string;

  @ApiProperty({ example: "Password123!", description: "Account password" })
  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token received during login or token rotation",
  })
  @IsNotEmpty({ message: "Refresh token is required" })
  @IsString()
  refreshToken: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: "d3b07384-d113-424a-a644-d9220088523c" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: "+8801700000000" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: "492018", description: "6-digit OTP code" })
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: "+8801700000000" })
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "+8801700000000" })
  @IsNotEmpty()
  @IsString()
  identifier: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "+8801700000000" })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: "492018", description: "6-digit OTP code" })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({ example: "NewSecretPassword123!", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!" })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: "NewPassword123!", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters long" })
  newPassword: string;
}
