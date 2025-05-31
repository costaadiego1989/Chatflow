import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { UpdateUserUseCase } from './update-user.use-case';
import { IHashService } from '../../../domain/ports/hash-service.interface';
import { ResultHelper } from '../../../helpers/result-helper';

describe('UpdateUserUseCase', () => {
  let updateUserUseCase: UpdateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let hashService: jest.Mocked<IHashService>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    hashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as jest.Mocked<IHashService>;

    updateUserUseCase = new UpdateUserUseCase(userRepository, hashService);
  });

  it('deve atualizar um usuário com sucesso', async () => {
    const userId = 'user-123';
    const updateData = {
      username: 'novousername',
      email: 'novo@email.com',
    };

    const existingUser = new User(
      userId,
      'old@email.com',
      'oldusername',
      'hashed_password',
    );

    const updatedUser = new User(
      userId,
      updateData.email,
      updateData.username,
      'hashed_password',
    );

    userRepository.findById.mockResolvedValue(
      ResultHelper.success(existingUser),
    );
    userRepository.update.mockResolvedValue(ResultHelper.success(updatedUser));

    const result = await updateUserUseCase.execute(userId, updateData);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.update).toHaveBeenCalledWith(
      userId,
      expect.any(User),
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual(updatedUser);
  });

  it('deve retornar falha quando o usuário não for encontrado', async () => {
    const userId = 'user-inexistente';
    const updateData = {
      username: 'novousername',
      email: 'novo@email.com',
    };

    userRepository.findById.mockResolvedValue(ResultHelper.success(null));

    const result = await updateUserUseCase.execute(userId, updateData);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('deve atualizar a senha de um usuário', async () => {
    const userId = 'user-123';
    const plainPassword = 'novasenha123';
    const hashedPassword = 'hashed_new_password';
    const updateData = {
      password: plainPassword,
    };

    const existingUser = new User(
      userId,
      'teste@exemplo.com',
      'testuser',
      'hashed_old_password',
    );

    const updatedUser = new User(
      userId,
      'teste@exemplo.com',
      'testuser',
      hashedPassword,
    );

    userRepository.findById.mockResolvedValue(
      ResultHelper.success(existingUser),
    );
    userRepository.update.mockResolvedValue(ResultHelper.success(updatedUser));
    hashService.hash.mockResolvedValue(hashedPassword);

    const result = await updateUserUseCase.execute(userId, updateData);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(hashService.hash).toHaveBeenCalledWith(plainPassword);
    expect(userRepository.update).toHaveBeenCalledWith(
      userId,
      expect.any(User),
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual(updatedUser);
  });

  it('deve retornar falha quando ocorrer um erro no repositório durante a atualização', async () => {
    const userId = 'user-123';
    const updateData = {
      username: 'novousername',
    };

    const existingUser = new User(
      userId,
      'teste@exemplo.com',
      'testuser',
      'hashed_password',
    );

    userRepository.findById.mockResolvedValue(
      ResultHelper.success(existingUser),
    );
    userRepository.update.mockResolvedValue(
      ResultHelper.failure('Database error'),
    );

    const result = await updateUserUseCase.execute(userId, updateData);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.update).toHaveBeenCalledWith(
      userId,
      expect.any(User),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('deve retornar falha quando ocorrer um erro no repositório durante a busca', async () => {
    const userId = 'user-123';
    const updateData = {
      username: 'novousername',
    };

    userRepository.findById.mockResolvedValue(
      ResultHelper.failure('Database connection error'),
    );

    const result = await updateUserUseCase.execute(userId, updateData);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection error');
  });
});
