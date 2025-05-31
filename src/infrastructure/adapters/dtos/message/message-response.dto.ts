export class MessageResponseDTO {
  id: string;
  content: string;
  authorId: string;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}
