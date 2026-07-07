import { validate } from 'class-validator';
import { CreateMediaDto } from './create-media.dto';
import { MediaType } from '../entity/media.entity';

describe('CreateMediaDto', () => {
  it('requires a poster image', async () => {
    const dto = new CreateMediaDto();
    Object.assign(dto, {
      type: MediaType.MOVIE,
      name: 'Test Movie',
      releaseDate: '2024-01-01',
      description: 'A test movie',
      genreIds: ['123e4567-e89b-12d3-a456-426614174000'],
      ageRestricted: false,
      ageRestricted13: false,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'posterUrl')).toBe(true);
  });
});
