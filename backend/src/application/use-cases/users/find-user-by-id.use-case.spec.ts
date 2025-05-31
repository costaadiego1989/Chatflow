import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { ResultHelper } from '../../../helpers/result-helper';

describe('FindUserByIdUseCase', () => {
  let findUserByIdUseCase: FindUserByIdUseCase;
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

    findUserByIdUseCase = new FindUserByIdUseCase(userRepository);
  });

  it('deve retornar um usuário quando encontrado pelo ID', async () => {
    const userId = 'user-123';
    const mockUser = new User(
      userId,
      'teste@exemplo.com',
      'testuser',
      'hashed_password',
    );

    userRepository.findById.mockResolvedValue(ResultHelper.success(mockUser));

    const result = await findUserByIdUseCase.execute(userId);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUser);
  });

  it('deve retornar falha quando o usuário não for encontrado', async () => {
    const userId = 'user-inexistente';
    userRepository.findById.mockResolvedValue(ResultHelper.success(null));

    const result = await findUserByIdUseCase.execute(userId);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('deve retornar falha quando ocorrer um erro no repositório', async () => {
    const userId = 'user-123';
    userRepository.findById.mockResolvedValue(ResultHelper.failure('Database error'));

    const result = await findUserByIdUseCase.execute(userId);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
