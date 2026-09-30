import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class BodyParamsDto {
  @IsInt()
  @Min(120)
  @Max(220)
  heightCm!: number;

  @IsInt()
  @Min(30)
  @Max(200)
  weightKg!: number;

  @IsInt()
  @Min(14)
  @Max(100)
  age!: number;

  @IsEnum(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
  preferredSize!: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
}
