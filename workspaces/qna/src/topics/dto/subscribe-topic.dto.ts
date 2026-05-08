import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SubscribeTopicDto {
  @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6a7', description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}