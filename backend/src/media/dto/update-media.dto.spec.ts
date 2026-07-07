import { validate } from 'class-validator';
import { UpdateMediaDto } from './update-media.dto';
import { AgeRestriction, MediaType } from '../entity/media.entity';

describe('UpdateMediaDto', () => {
  it('accepts ageRestriction when updating media', async () => {
    const dto = new UpdateMediaDto();
    Object.assign(dto, {
      ageRestriction: AgeRestriction.PG13,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
