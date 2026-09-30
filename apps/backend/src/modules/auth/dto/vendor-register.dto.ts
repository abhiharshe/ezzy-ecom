import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class VendorRegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  business_name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  pan_number?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid support email' })
  support_email?: string;

  @IsOptional()
  @IsString()
  support_phone?: string;
}
