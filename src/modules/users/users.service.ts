import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { HashUtil } from "../../common/utils/hash.util";
import { PaginationUtil } from "../../common/utils/pagination.util";
import { Prisma, Role, UserStatus } from "@prisma/client";
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UserQueryDto,
} from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private userSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    avatarUrl: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll(query: UserQueryDto) {
    const { skip, take, page, limit } = PaginationUtil.getSkipTake(query);

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [query.sortBy || "createdAt"]: query.sortOrder || "desc",
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: this.userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return PaginationUtil.paginate(users, total, page, limit);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phone.trim() },
          ...(dto.email ? [{ email: dto.email.toLowerCase().trim() }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException("User with this phone or email already exists");
    }

    const hashedPassword = await HashUtil.hash(dto.password);

    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone.trim(),
        email: dto.email ? dto.email.toLowerCase().trim() : null,
        passwordHash: hashedPassword,
        role: dto.role || Role.CUSTOMER,
        status: dto.status || UserStatus.ACTIVE,
      },
      select: this.userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
        phone: dto.phone,
        role: dto.role,
        status: dto.status,
      },
      select: this.userSelect,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.findById(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
        phone: dto.phone,
      },
      select: this.userSelect,
    });
  }

  async remove(id: string) {
    await this.findById(id);

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    });

    return { message: "User suspended successfully" };
  }
}
