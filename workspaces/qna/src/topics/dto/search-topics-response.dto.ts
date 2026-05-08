import { ApiProperty } from '@nestjs/swagger';
import { TopicDetailsResponseDto } from './topic-details-response.dto';

export class SearchTopicsResponseDto {
  @ApiProperty({ type: [TopicDetailsResponseDto] })
  data: TopicDetailsResponseDto[];

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