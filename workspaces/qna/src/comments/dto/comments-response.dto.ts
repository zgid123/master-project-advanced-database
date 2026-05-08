import { ApiProperty } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  topic_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  is_accepted: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ example: 3 })
  vote_score: number;
}

export class CommentsPaginatedResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  data: CommentResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 10, total: 100, total_pages: 10 },
    description: 'Pagination info',
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}