import { PartialType } from '@nestjs/mapped-types';
import { CreateMediaDto } from './create-media.dto';

// PartialType makes every field from CreateMediaDto optional —
// perfect for PATCH /media/:id where you only send changed fields.
export class UpdateMediaDto extends PartialType(CreateMediaDto) {}