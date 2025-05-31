import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMessageDTO {
  @IsNotEmpty({ message: 'The content is required' })
  @IsString({ message: 'The content must be a string' })
  content: string;
}
