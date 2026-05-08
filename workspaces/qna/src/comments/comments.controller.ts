import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import {
  CommentCreatedResponseSwagger,
  CommentAcceptedResponseSwagger,
  CommentUpdatedResponseSwagger,
  CommentDeletedResponseSwagger
} from './comments.swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller('comments')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a comment on a topic' })
  @ApiBody({
    type: CreateCommentDto,
    examples: {
      example: {
        summary: 'Create comment',
        value: {
          topic_id: '6638e1f2c2a1b2c3d4e5f6a7',
          user_id: '6638e1f2c2a1b2c3d4e5f6b8',
          content: 'This is a comment.'
        }
      }
    }
  })
  @ApiCreatedResponse(CommentCreatedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async createComment(@Body() dto: CreateCommentDto) {
    return await this.commentsService.createComment(dto);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Mark comment as accepted answer (only topic owner)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic_id: { type: 'string', example: '6638e1f2c2a1b2c3d4e5f6a7' },
        user_id: { type: 'string', example: '6638e1f2c2a1b2c3d4e5f6b8' }
      },
      required: ['topic_id', 'user_id']
    }
  })
  @ApiOkResponse(CommentAcceptedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found / Comment not found' })
  @ApiForbiddenResponse({ description: 'Comment does not belong to this topic / You are not the owner of this topic' })
  async acceptComment(@Param('id') id: string, @Body('topic_id') topic_id: string, @Body('user_id') user_id: string) {
    return await this.commentsService.acceptComment(id, topic_id, user_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment (only owner)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({
    type: UpdateCommentDto,
    examples: {
      example: {
        summary: 'Update comment',
        value: {
          content: 'Updated comment content',
          user_id: '6638e1f2c2a1b2c3d4e5f6b8'
        }
      }
    }
  })
  @ApiOkResponse(CommentUpdatedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'You are not the owner of this comment' })
  async updateComment(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return await this.commentsService.updateComment(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment (soft delete, only owner)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', example: '6638e1f2c2a1b2c3d4e5f6b8' }
      },
      required: ['user_id']
    }
  })
  @ApiOkResponse(CommentDeletedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'You are not the owner of this comment / Accepted answer cannot be deleted.' })
  @HttpCode(HttpStatus.OK)
  async deleteComment(@Param('id') id: string, @Body('user_id') user_id: string) {
    return await this.commentsService.deleteComment(id, user_id);
  }

  // @Get('topic/:topicId')
  // @ApiOperation({ summary: 'Get comments by topic' })
  // @ApiParam({ name: 'topicId', description: 'Topic ID' })
  // @ApiResponse({ status: 200, description: 'Comments for topic' })
  // async getCommentsByTopic(@Param('topicId') topicId: string) {
  //   return await this.commentsService.getCommentsByTopic(topicId);
  // }
}
