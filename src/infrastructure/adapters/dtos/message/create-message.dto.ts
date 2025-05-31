import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMessageDTO {
  @IsNotEmpty({ message: 'The content is required' })
  @IsString({ message: 'The content must be a string' })
  content: string;

  @IsNotEmpty({ message: 'The roomId is required' })
  @IsUUID('4', { message: 'The roomId must be a valid UUID' })
  roomId: string;

  @IsNotEmpty({ message: 'The authorId is required' })
  @IsUUID('4', { message: 'The authorId must be a valid UUID' })
  authorId: string;
}
