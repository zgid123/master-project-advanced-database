import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class VoteCommentDto {
  @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6a7', description: 'User ID' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({ example: 1, description: 'Vote value: 1 (upvote) or -1 (downvote)' })
  @IsIn([1, -1])
  point: number;
}