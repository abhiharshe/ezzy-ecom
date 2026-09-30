import { IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateAffiliateLinkDto {
  @IsNotEmpty()
  @IsString()
  destination_url!: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  custom_slug?: string;
}
