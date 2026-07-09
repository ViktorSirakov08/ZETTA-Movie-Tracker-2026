import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
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
import { IsValidDateOfBirth } from '../../common/validators/is-valid-date-of-birth.decorator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username may only contain letters, numbers, underscores, dots and hyphens',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsDateString()
  @IsValidDateOfBirth()
  dateOfBirth: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(INTEREST_NAMES, { each: true })
  interests?: InterestName[];
}
