import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TopicDetailsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  body?: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  is_solved: boolean;

  @ApiProperty()
  user_id: string;

  @ApiPropertyOptional()
  substack_id?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ example: 5 })
  vote_score: number;

  @ApiProperty({ example: 10 })
  comments_count: number;

  @ApiProperty({ example: 3 })
  subscriptions_count: number;

  @ApiPropertyOptional({ type: Object })
  accepted_comment?: any;

  @ApiPropertyOptional({ type: [Object] })
  comments?: any[];
}