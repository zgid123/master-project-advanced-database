import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6a7', description: 'Topic ID to comment on' })
  @IsString()
  @IsNotEmpty()
  topic_id: string;

  @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6b8', description: 'User ID of the commenter' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({ example: 'This is a comment.', description: 'Content of the comment' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
