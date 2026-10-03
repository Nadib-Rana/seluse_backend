import { Controller, Get, Post, Body, Req, Ip } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "./database/prisma.service";
import { AppService } from "./app.service";
import { Public } from "./common/decorators/public.decorator";
import { ResponseMessage } from "./common/decorators/response-message.decorator";
import { Request } from "express";

@ApiTags("General")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get API starter status and information" })
  @ResponseMessage("API is operational")
  getAppInfo() {
    return this.appService.getAppInfo();
  }

  @Public()
  @Get("settings")
  @ApiOperation({ summary: "Get public store settings (e.g., GA ID, Store Name)" })
  async getPublicSettings() {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            "storeName", "gaMeasurementId", "currency", "metaTitle", "metaDesc",
            "bkashActive", "nagadActive", "rocketActive", "cardActive", "codActive",
            "bkashMerchant", "nagadMerchant", "rocketMerchant"
          ],
        },
      },
    });
    
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);
  }

  @Public()
  @Post("analytics/track")
  @ApiOperation({ summary: "Track page view" })
  async trackPageView(
    @Body() body: { path: string; referrer?: string },
    @Req() req: Request,
    @Ip() ip: string
  ) {
    const userAgent = req.headers["user-agent"] || "";
    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    
    let os = "Unknown";
    if (userAgent.includes("Win")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "MacOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone")) os = "iOS";

    let device = "Desktop";
    if (/Mobi|Android|iPhone/i.test(userAgent)) device = "Mobile";
    else if (/Tablet|iPad/i.test(userAgent)) device = "Tablet";

    await this.prisma.visitorLog.create({
      data: {
        ip: ip || "0.0.0.0",
        userAgent,
        path: body.path || "/",
        referrer: body.referrer || null,
        browser,
        os,
        device
      }
    });
    return { success: true };
  }
}
