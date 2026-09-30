import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReindexCatalogDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unindexed_only?: boolean = false;
}
