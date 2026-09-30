import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  first_name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  last_name!: string;

  @IsOptional()
  @IsString()
  phone_number?: string;
}
