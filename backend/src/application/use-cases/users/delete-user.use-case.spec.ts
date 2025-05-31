import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { DeleteUserUseCase } from './delete-user.use-case';
import { ResultHelper } from '../../../helpers/result-helper';

describe('DeleteUserUseCase', () => {
  let deleteUserUseCase: DeleteUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    deleteUserUseCase = new DeleteUserUseCase(userRepository);
  });

  it('deve excluir um usuário com sucesso quando ele existir', async () => {
    const userId = 'user-123';
    const mockUser = new User(
      userId,
      'teste@exemplo.com',
      'testuser',
      'hashed_password',
    );

    userRepository.findById.mockResolvedValue(ResultHelper.success(mockUser));
    userRepository.delete.mockResolvedValue(ResultHelper.success());

    const result = await deleteUserUseCase.execute(userId);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.delete).toHaveBeenCalledWith(userId);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it('deve retornar falha quando o usuário não for encontrado', async () => {
    const userId = 'user-inexistente';
    userRepository.findById.mockResolvedValue(ResultHelper.success(null));

    const result = await deleteUserUseCase.execute(userId);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.delete).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('deve retornar falha quando ocorrer um erro na exclusão', async () => {
    const userId = 'user-123';
    const mockUser = new User(
      userId,
      'teste@exemplo.com',
      'testuser',
      'hashed_password',
    );

    userRepository.findById.mockResolvedValue(ResultHelper.success(mockUser));
    userRepository.delete.mockResolvedValue(ResultHelper.failure('Database error'));

    const result = await deleteUserUseCase.execute(userId);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.delete).toHaveBeenCalledWith(userId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('deve retornar falha quando o repositório retornar erro ao buscar usuário', async () => {
    const userId = 'user-123';
    userRepository.findById.mockResolvedValue(ResultHelper.failure('Database connection error'));

    const result = await deleteUserUseCase.execute(userId);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.delete).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection error');
  });
});
