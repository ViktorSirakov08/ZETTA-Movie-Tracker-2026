import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Interest } from './entities/interest.entity';
import { UserInterest } from './entities/user-interest.entity';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(Interest)
    private readonly interestsRepository: Repository<Interest>,
    @InjectRepository(UserInterest)
    private readonly userInterestsRepository: Repository<UserInterest>,
  ) {}

  async findOrCreateByNames(names: string[]): Promise<Interest[]> {
    const uniqueNames = Array.from(new Set(names));
    if (uniqueNames.length === 0) {
      return [];
    }

    const existing = await this.interestsRepository.find({
      where: { name: In(uniqueNames) },
    });
    const existingNames = new Set(existing.map((interest) => interest.name));

    const missingNames = uniqueNames.filter((name) => !existingNames.has(name));
    if (missingNames.length === 0) {
      return existing;
    }

    const created = await this.interestsRepository.save(
      missingNames.map((name) => this.interestsRepository.create({ name })),
    );

    return [...existing, ...created];
  }

  async setUserInterests(userId: string, names: string[]): Promise<void> {
    await this.userInterestsRepository.delete({ userId });

    const interests = await this.findOrCreateByNames(names);
    if (interests.length === 0) {
      return;
    }

    await this.userInterestsRepository.save(
      interests.map((interest) =>
        this.userInterestsRepository.create({
          userId,
          interestId: interest.id,
        }),
      ),
    );
  }
}
