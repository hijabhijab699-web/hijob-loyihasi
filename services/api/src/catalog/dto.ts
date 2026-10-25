import { IsIn, IsInt, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CatalogFiltersDto {
  @IsOptional()
  @IsIn(['scarves', 'dresses', 'shoes', 'bags', 'accessories'])
  category?: 'scarves' | 'dresses' | 'shoes' | 'bags' | 'accessories';

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(['slim', 'regular', 'plus'])
  bodyFit?: 'slim' | 'regular' | 'plus';

  @IsOptional()
  @IsIn(['popularity', 'priceLow', 'priceHigh', 'new'])
  sort?: 'popularity' | 'priceLow' | 'priceHigh' | 'new';

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class StoreFiltersDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  q?: string;

  // When these three are set, stores within `radiusKm` km of (lat, lng) are
  // returned ordered by distance ascending. radiusKm defaults to 50.
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number;
}
