import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchTopicDto {
    @ApiPropertyOptional({ example: 'abc', description: 'Keyword to search in topic titles and bodies' })
    @IsString()
    @IsOptional()
    query?: string;

    @ApiPropertyOptional({ example: 1, description: 'Page number for pagination' })
    @IsString()
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ example: 10, description: 'Number of topics per page' })
    @IsString()
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({ example: '6638e1f2c2a1b2c3d4e5f6a7' })
    @IsString()
    @IsOptional()
    substack_id?: string;
}