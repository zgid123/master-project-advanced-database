import { forwardRef, Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsRepo } from './comments.repo';
import { TopicsModule } from 'src/topics/topics.module';
import { VotesModule } from 'src/votes/votes.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),
    forwardRef(() => TopicsModule),
    forwardRef(() => VotesModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepo],
  exports: [CommentsRepo],
})
export class CommentsModule { }
