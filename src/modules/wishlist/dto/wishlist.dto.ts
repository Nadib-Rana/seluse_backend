import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class AddToWishlistDto {
  @ApiProperty({
    example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    description: "ID of the product to add to wishlist",
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;
}
