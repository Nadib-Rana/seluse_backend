import { Role, UserStatus } from "@prisma/client";

export { Role, UserStatus };

export enum Environment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
  TEST = "test",
}
