import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTopicDto {
    @ApiProperty({ example: 'Updated topic title', description: 'Title of the topic', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @ApiProperty({ example: 'Updated body content', description: 'Body of the topic', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    body?: string;

    @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6a7', description: 'User ID of the topic owner' })
    @IsOptional()
    @IsString()
    user_id?: string;

    @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6b8', description: 'Substack ID (optional)', required: false })
    @IsOptional()
    @IsString()
    substack_id?: string;
}
