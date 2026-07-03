import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  INTEREST_NAMES,
  type InterestName,
} from '../../common/constants/interest-names';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username may only contain letters, numbers, underscores, dots and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(INTEREST_NAMES, { each: true })
  interests?: InterestName[];
}
