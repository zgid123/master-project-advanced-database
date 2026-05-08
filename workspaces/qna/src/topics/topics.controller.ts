import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import {
  MessageResponseSwagger,
  UnsubscribedResponseSwagger,
  VoteRecordedResponseSwagger,
  VoteRemovedResponseSwagger,
  TopicCreatedResponseSwagger,
  SearchTopicsResponseSwagger,
  MarkSolvedResponseSwagger,
  TopicUpdatedResponseSwagger,
  DeleteTopicResponseSwagger,
  GetCommentsByTopicResponseSwagger,
  GetTopicByIdResponseSwagger
} from './topics.swagger';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { SearchTopicDto } from './dto/search-topic.dto';
import { VoteTopicDto } from './dto/vote-topic.dto';

@ApiTags('Topics')
@Controller('topics')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) { }

  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Subscribe to a topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', example: '6638e1f2c2a1b2c3d4e5f6b8' }
      },
      required: ['user_id']
    }
  })
  @ApiOkResponse(MessageResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async subscribeToTopic(@Param('id') id: string, @Body('user_id') user_id: string) {
    return await this.topicsService.subscribeTopic(id, user_id);
  }

  @Post(':id/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from a topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', example: '6638e1f2c2a1b2c3d4e5f6b8' }
      },
      required: ['user_id']
    }
  })
  @ApiOkResponse(UnsubscribedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async unsubscribeFromTopic(@Param('id') id: string, @Body('user_id') user_id: string) {
    return await this.topicsService.unsubscribeTopic(id, user_id);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiBody({
    type: VoteTopicDto,
    examples: {
      example: {
        summary: 'Vote on topic',
        value: {
          user_id: '6638e1f2c2a1b2c3d4e5f6a7',
          point: 1
        }
      }
    }
  })
  @ApiOkResponse(VoteRecordedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  @ApiBadRequestResponse({ description: 'Invalid vote value' })
  async voteOnTopic(@Param('id') id: string, @Body() dto: VoteTopicDto) {
    return await this.topicsService.voteTopic(id, dto);
  }

  @Delete(':id/vote')
  @ApiOperation({ summary: 'Remove vote from a topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiQuery({ name: 'user_id', description: 'User ID of the voter', required: true })
  @ApiOkResponse(VoteRemovedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async removeVoteFromTopic(@Param('id') id: string, @Query('user_id') user_id: string) {
    return await this.topicsService.removeVote(id, user_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new topic' })
  @ApiBody({
    type: CreateTopicDto,
    examples: {
      example: {
        summary: 'Create topic',
        value: {
          title: 'Best plants for indoor gardening?',
          body: 'I am looking for recommendations on easy-to-care-for indoor plants.',
          user_id: '6638e1f2c2a1b2c3d4e5f6a7',
          substack_id: '6638e1f2c2a1b2c3d4e5f6b8'
        }
      }
    }
  })
  @ApiCreatedResponse(TopicCreatedResponseSwagger)
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async createTopic(@Body() dto: CreateTopicDto) {
    const topic = await this.topicsService.createTopic(dto);
    return topic;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search topics by text' })
  @ApiOkResponse(SearchTopicsResponseSwagger)
  async searchTopics(@Query() dto: SearchTopicDto) {
    return await this.topicsService.searchTopics(dto);
  }

  @Patch(':id/solve')
  @ApiOperation({ summary: 'Mark topic as solved (only owner)' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiQuery({ name: 'user_id', description: 'User ID of the owner', required: true })
  @ApiOkResponse(MarkSolvedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  @ApiForbiddenResponse({ description: 'You are not the owner of this topic' })
  async markSolved(@Param('id') id: string, @Query('user_id') user_id: string) {
    return await this.topicsService.markSolved(id, user_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a topic (only owner)' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiBody({
    type: UpdateTopicDto,
    examples: {
      example: {
        summary: 'Update topic',
        value: {
          title: 'Updated topic title',
          body: 'Updated body content',
          user_id: '6638e1f2c2a1b2c3d4e5f6a7'
        }
      }
    }
  })
  @ApiOkResponse(TopicUpdatedResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  @ApiForbiddenResponse({ description: 'You are not the owner of this topic' })
  async updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return await this.topicsService.updateTopic(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a topic (soft delete, only owner)' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiQuery({ name: 'user_id', description: 'User ID of the owner', required: true })
  @ApiOkResponse(DeleteTopicResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  @ApiForbiddenResponse({ description: 'You are not the owner of this topic' })
  @HttpCode(HttpStatus.OK)
  async deleteTopic(@Param('id') id: string, @Query('user_id') user_id: string) {
    return await this.topicsService.deleteTopic(id, user_id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiOkResponse(GetCommentsByTopicResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async getCommentsByTopic(@Param('id') id: string) {
    return await this.topicsService.getCommentsByTopic(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiOkResponse(GetTopicByIdResponseSwagger)
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async getTopicById(@Param('id') id: string) {
    return await this.topicsService.getTopicById(id);
  }
}
