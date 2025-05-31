import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { IHashService } from '../../../domain/ports/hash-service.interface';
import { CreateUserUseCase } from './create-user.use-case';
import { ValidateEmail } from 'src/helpers/validate-email';
import { ResultHelper } from '../../../helpers/result-helper';

describe('CreateUserUseCase', () => {
  const mockUserRepository: jest.Mocked<IUserRepository> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockHashService: jest.Mocked<IHashService> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockValidateEmail = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: jest.fn(),
  };

  let makeSut: CreateUserUseCase;

  const email = 'test@example.com';
  const username = 'testuser';
  const password = 'password123';
  const hashedPassword = 'hashed_password';
  const userId = 'user-123';
  const mockUser = new User(userId, email, username, hashedPassword);

  beforeEach(() => {
    jest.clearAllMocks();
    makeSut = new CreateUserUseCase(
      mockUserRepository,
      mockHashService,
      mockValidateEmail as ValidateEmail,
    );
  });

  it('deve criar um usuário com sucesso se todos os dados são válidos', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(null),
    );
    mockUserRepository.findByUsername.mockResolvedValue(
      ResultHelper.success(null),
    );
    mockHashService.hash.mockResolvedValue(hashedPassword);
    mockUserRepository.save.mockResolvedValue(ResultHelper.success(mockUser));
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await makeSut.execute({
      email,
      username,
      password,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUser);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
    expect(mockValidateEmail.validate).toHaveBeenCalledWith(email);
    expect(mockHashService.hash).toHaveBeenCalledWith(password);
    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email,
        username,
        password: hashedPassword,
      }),
    );
  });

  it('deve retornar erro quando o email já está em uso', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(mockUser),
    );
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await makeSut.execute({
      email,
      username,
      password,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email already in use');
    expect(result.data).toBeUndefined();
    expect(mockValidateEmail.validate).toHaveBeenCalledWith(email);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    expect(mockHashService.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o nome de usuário já está em uso', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(null),
    );
    mockUserRepository.findByUsername.mockResolvedValue(
      ResultHelper.success(mockUser),
    );
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await makeSut.execute({
      email,
      username,
      password,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Username already in use');
    expect(result.data).toBeUndefined();
    expect(mockValidateEmail.validate).toHaveBeenCalledWith(email);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
    expect(mockHashService.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o email é inválido', async () => {
    const invalidEmail = 'invalid-email';
    mockValidateEmail.validate.mockReturnValue(false);

    const result = await makeSut.execute({
      email: invalidEmail,
      username,
      password,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
    expect(result.data).toBeUndefined();
    expect(mockValidateEmail.validate).toHaveBeenCalledWith(invalidEmail);
    expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    expect(mockHashService.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando a senha é muito curta', async () => {
    const weakPassword = '123';
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await makeSut.execute({
      email,
      username,
      password: weakPassword,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Password must be at least 6 characters long');
    expect(result.data).toBeUndefined();
    expect(mockValidateEmail.validate).toHaveBeenCalledWith(email);
    expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    expect(mockHashService.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando ocorrer um erro no repositório durante a criação', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(null),
    );
    mockUserRepository.findByUsername.mockResolvedValue(
      ResultHelper.success(null),
    );
    mockHashService.hash.mockResolvedValue(hashedPassword);
    mockUserRepository.save.mockResolvedValue(
      ResultHelper.failure('Database error'),
    );
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await makeSut.execute({
      email,
      username,
      password,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('deve retornar erro quando o repositório retornar erro ao buscar email', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.failure('Database connection error'),
    );
    mockValidateEmail.validate.mockReturnValue(true);

    const result = await makeSut.execute({
      email,
      username,
      password,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection error');
  });
});
