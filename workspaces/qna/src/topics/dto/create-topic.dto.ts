import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTopicDto {
    @ApiProperty({ example: 'Best practices for healthy sleep habits', description: 'Title of the topic' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @ApiProperty({ example: 'I am looking for advice on how to improve my sleep quality.', description: 'Body of the topic', required: false })
    @IsString()
    @MaxLength(5000)
    body?: string;

    @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6a7', description: 'User ID of the topic creator' })
    @IsString()
    @IsNotEmpty()
    user_id: string;

    @ApiProperty({ example: '6638e1f2c2a1b2c3d4e5f6b8', description: 'Substack ID (optional)', required: false })
    @IsString()
    substack_id?: string;
}
