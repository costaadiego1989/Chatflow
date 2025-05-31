import { ResultHelper } from '../../../helpers/result-helper';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';
import { ValidateEmail } from '../../../helpers/validate-email';
import { UserRepository } from '../../../infrastructure/repositories/users/user.repository';

describe('UpdateUserProfileUseCase', () => {
  const mockUserRepository: jest.Mocked<IUserRepository> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockValidateEmail = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: jest.fn(),
  };

  let sut: UpdateUserProfileUseCase;

  const userId = 'user-123';
  const email = 'test@example.com';
  const username = 'testuser';
  const password = 'password123';
  const avatar = 'https://example.com/avatar.jpg';
  const mockUser = new User(userId, email, username, password);

  beforeEach(() => {
    jest.clearAllMocks();
    sut = new UpdateUserProfileUseCase(
      mockUserRepository as unknown as UserRepository,
      mockValidateEmail as ValidateEmail,
    );
  });

  it('deve atualizar o perfil do usuário com sucesso', async () => {
    const updatedUser = new User(userId, email, 'newusername', password);
    updatedUser.avatar = avatar;

    mockUserRepository.findById.mockResolvedValue(ResultHelper.success(mockUser));
    mockUserRepository.findByUsername.mockResolvedValue(ResultHelper.success(null));
    mockUserRepository.update.mockResolvedValue(ResultHelper.success(updatedUser));
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await sut.execute({
      userId,
      username: 'newusername',
      avatar,
    });

    expect(result.success).toBe(true);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
      'newusername',
    );
    expect(mockUserRepository.update).toHaveBeenCalled();
  });

  it('deve retornar erro quando o nome de usuário já estiver em uso', async () => {
    const existingUser = new User(
      'other-id',
      'other@example.com',
      'existinguser',
      'password',
    );

    mockUserRepository.findById.mockResolvedValue(ResultHelper.success(mockUser));
    mockUserRepository.findByUsername.mockResolvedValue(ResultHelper.success(existingUser));
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await sut.execute({
      userId,
      username: 'existinguser',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Username already in use');
    expect(result.user).toBeUndefined();
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
      'existinguser',
    );
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o usuário não for encontrado', async () => {
    mockUserRepository.findById.mockResolvedValue(ResultHelper.failure('User not found'));

    const result = await sut.execute({
      userId: 'non-existent-id',
      username: 'newusername',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
    expect(result.user).toBeUndefined();
    expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent-id');
    expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o formato do email for inválido', async () => {
    mockUserRepository.findById.mockResolvedValue(ResultHelper.success(mockUser));
    mockValidateEmail.validate.mockReturnValue(false);

    const result = await sut.execute({
      userId,
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
    expect(result.user).toBeUndefined();
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockValidateEmail.validate).toHaveBeenCalledWith('invalid-email');
    expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o email já estiver em uso', async () => {
    const existingUser = new User(
      'other-id',
      'existing@example.com',
      'otheruser',
      'password',
    );

    mockUserRepository.findById.mockResolvedValue(ResultHelper.success(mockUser));
    mockUserRepository.findByEmail.mockResolvedValue(ResultHelper.success(existingUser));
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await sut.execute({
      userId,
      email: 'existing@example.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email already in use');
    expect(result.user).toBeUndefined();
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockValidateEmail.validate).toHaveBeenCalledWith(
      'existing@example.com',
    );
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'existing@example.com',
    );
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });
});
