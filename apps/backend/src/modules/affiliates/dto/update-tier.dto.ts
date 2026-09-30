import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { AffiliateTier, AffiliateStatus } from '@ezzy-ecomm/database';

export class UpdateAffiliateTierDto {
  @IsOptional()
  @IsEnum(AffiliateTier)
  tier?: AffiliateTier;

  @IsOptional()
  @IsEnum(AffiliateStatus)
  status?: AffiliateStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission_rate_override?: number;
}
