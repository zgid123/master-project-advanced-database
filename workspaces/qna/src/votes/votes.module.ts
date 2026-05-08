import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { VotesRepo } from './votes.repo';
import { MongooseModule } from '@nestjs/mongoose';
import { Vote, VoteSchema } from './schemas/vote.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Vote.name,
        schema: VoteSchema,
      },
    ]),
  ],
  controllers: [VotesController],
  providers: [VotesService, VotesRepo],
  exports: [VotesRepo],
})
export class VotesModule { }
