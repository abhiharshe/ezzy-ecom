import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class OnboardAffiliateDto {
  @IsOptional()
  @IsString()
  @Length(4, 20)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'Referral code can only contain alphanumeric characters, hyphens, and underscores',
  })
  custom_referral_code?: string;

  @IsOptional()
  @IsString()
  upline_referral_code?: string;

  @IsOptional()
  bank_payout_details?: {
    upi_id?: string;
    account_number?: string;
    ifsc_code?: string;
    beneficiary_name?: string;
  };
}
