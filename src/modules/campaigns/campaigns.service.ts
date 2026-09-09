import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCampaignDto } from "./dto/campaign.dto";

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive() {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findBySlug(slug: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { slug },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${slug} not found`);
    }

    return campaign;
  }

  async findAllAdmin() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateCampaignDto) {
    const existing = await this.prisma.campaign.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Campaign with slug ${dto.slug} already exists`);
    }

    return this.prisma.campaign.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description || null,
        bannerUrl: dto.bannerUrl || null,
        discountPct: dto.discountPct || null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async remove(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    return this.prisma.campaign.delete({ where: { id } });
  }
}
