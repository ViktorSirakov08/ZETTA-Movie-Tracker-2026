import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interest } from './entities/interest.entity';
import { UserInterest } from './entities/user-interest.entity';
import { InterestsService } from './interests.service';

@Module({
  imports: [TypeOrmModule.forFeature([Interest, UserInterest])],
  providers: [InterestsService],
  exports: [InterestsService],
})
export class InterestsModule {}
