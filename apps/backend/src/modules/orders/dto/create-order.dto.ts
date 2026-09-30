import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemInputDto {
  @IsUUID('4', { message: 'Valid variant ID is required' })
  variant_id!: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity!: number;
}

export class AddressInputDto {
  @IsString()
  @IsNotEmpty()
  recipient_name!: string;

  @IsString()
  @IsNotEmpty()
  phone_number!: string;

  @IsString()
  @IsNotEmpty()
  address_line1!: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  postal_code!: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => AddressInputDto)
  shipping_address!: AddressInputDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressInputDto)
  billing_address?: AddressInputDto;

  @IsOptional()
  @IsString()
  customer_notes?: string;

  @IsOptional()
  @IsString()
  coupon_code?: string;

  @IsOptional()
  @IsString()
  affiliate_code?: string;
}
