import { IsInt, Min, Max } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(0)
  @Max(5)
  value!: number;
}