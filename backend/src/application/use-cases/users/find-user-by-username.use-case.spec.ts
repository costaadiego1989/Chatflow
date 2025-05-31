import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { FindUserByUsernameUseCase } from './find-user-by-username.use-case';
import { ResultHelper } from '../../../helpers/result-helper';

describe('FindUserByUsernameUseCase', () => {
  let findUserByUsernameUseCase: FindUserByUsernameUseCase;
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

    findUserByUsernameUseCase = new FindUserByUsernameUseCase(userRepository);
  });

  it('deve retornar um usuário se encontrado pelo username', async () => {
    const username = 'testuser';
    const mockUser = new User(
      'user-123',
      'teste@exemplo.com',
      username,
      'hashed_password',
    );

    userRepository.findByUsername.mockResolvedValue(ResultHelper.success(mockUser));

    const result = await findUserByUsernameUseCase.execute(username);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUser);
    expect(userRepository.findByUsername).toHaveBeenCalledWith(username);
  });

  it('deve retornar um erro quando o usuário não for encontrado', async () => {
    const username = 'nonexistentuser';
    userRepository.findByUsername.mockResolvedValue(ResultHelper.success(null));

    const result = await findUserByUsernameUseCase.execute(username);

    expect(result.success).toBe(false);
    expect(result.error).toBe(`User with username '${username}' not found`);
    expect(userRepository.findByUsername).toHaveBeenCalledWith(username);
  });

  it('deve retornar um erro quando o username for vazio', async () => {
    let result = await findUserByUsernameUseCase.execute('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Username cannot be empty');
    expect(userRepository.findByUsername).not.toHaveBeenCalled();

    result = await findUserByUsernameUseCase.execute('   ');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Username cannot be empty');
    expect(userRepository.findByUsername).not.toHaveBeenCalled();

    result = await findUserByUsernameUseCase.execute(undefined as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Username cannot be empty');
    expect(userRepository.findByUsername).not.toHaveBeenCalled();
  });

  it('deve retornar falha quando ocorrer um erro no repositório', async () => {
    const username = 'testuser';
    userRepository.findByUsername.mockResolvedValue(ResultHelper.failure('Database error'));

    const result = await findUserByUsernameUseCase.execute(username);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(userRepository.findByUsername).toHaveBeenCalledWith(username);
  });
});
