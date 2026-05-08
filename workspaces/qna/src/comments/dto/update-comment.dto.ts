import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment content', description: 'Content of the comment', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6b8', description: 'User ID of the commenter' })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
