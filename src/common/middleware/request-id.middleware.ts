import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { requestContext, RequestContextStore } from "../context/storage";
import { REQUEST_ID_KEY } from "../context/context.service";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    const store: RequestContextStore = new Map();
    store.set(REQUEST_ID_KEY, requestId);
    res.setHeader("x-request-id", requestId);

    const { method, originalUrl } = req;
    const ip = req.ip || req.socket.remoteAddress || "Unknown";
    const startTime = Date.now();

    res.on("finish", () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      
      const resSize = res.getHeader("content-length") || 0;
      const userId = (req as any).user?.id || "anonymous";

      // ANSI Colors
      const reset = "\x1b[0m";
      const dim = "\x1b[90m";
      const cyan = "\x1b[36m";
      const green = "\x1b[32m";
      const yellow = "\x1b[33m";
      const red = "\x1b[31m";
      const magenta = "\x1b[35m";
      const blue = "\x1b[34m";

      // Formatting
      const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const timeStr = `${dim}[${timestamp}]${reset}`;
      
      const levelStr = statusCode >= 500 ? `${red}[ERROR]${reset}` : statusCode >= 400 ? `${yellow}[WARN]${reset}` : `${green}[INFO]${reset}`;
      
      const serviceStr = `${magenta}[seluse-api]${reset}`;

      let methodColor = reset;
      if (method === "GET") methodColor = cyan;
      else if (method === "POST") methodColor = green;
      else if (method === "PUT" || method === "PATCH") methodColor = yellow;
      else if (method === "DELETE") methodColor = red;
      
      const methodStr = `${methodColor}${method}${reset}`;
      
      let statusColor = green;
      if (statusCode >= 500) statusColor = red;
      else if (statusCode >= 400) statusColor = yellow;
      else if (statusCode >= 300) statusColor = cyan;
      
      const statusStr = `${statusColor}${statusCode}${reset}`;
      const durationStr = `${yellow}(${duration}ms)${reset}`;
      
      const logLine = `${timeStr} ${levelStr} ${serviceStr} ${methodStr} ${originalUrl} - ${statusStr} ${durationStr} | IP: ${ip} | Size: ${resSize}b | User: ${userId} | Correlation ID: ${requestId}`;
      
      console.log(logLine);
    });

    requestContext.run(store, () => {
      next();
    });
  }
}

