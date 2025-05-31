import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { IHashService } from '../../../domain/ports/hash-service.interface';
import { ITokenService } from '../../../domain/ports/token-service.interface';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';
import { ResultHelper } from '../../../helpers/result-helper';

describe('AuthenticateUserUseCase', () => {
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

  const mockTokenService: jest.Mocked<ITokenService> = {
    generateToken: jest.fn(),
    validateToken: jest.fn(),
  };

  let sut: AuthenticateUserUseCase;

  const email = 'test@example.com';
  const password = 'password123';
  const hashedPassword = 'hashed_password';
  const userId = 'user-123';
  const mockToken = 'mock-jwt-token';
  const mockUser = new User(userId, email, 'testuser', hashedPassword);

  beforeEach(() => {
    jest.clearAllMocks();
    sut = new AuthenticateUserUseCase(
      mockUserRepository,
      mockHashService,
      mockTokenService,
    );
  });

  it('deve autenticar um usuário com credenciais válidas e retornar um token', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(mockUser),
    );
    mockHashService.compare.mockResolvedValue(true);
    mockTokenService.generateToken.mockResolvedValue(mockToken);

    const result = await sut.authenticate(email, password);

    expect(result.success).toBe(true);
    expect(result.data.token).toBe(mockToken);
    expect(result.data.user).toEqual(mockUser);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockHashService.compare).toHaveBeenCalledWith(
      password,
      hashedPassword,
    );
    expect(mockTokenService.generateToken).toHaveBeenCalledWith(userId);
  });

  it('deve retornar erro quando o usuário não for encontrado', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(null),
    );

    const result = await sut.authenticate(email, password);

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
    expect(result.data).toBeUndefined();
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockHashService.compare).not.toHaveBeenCalled();
    expect(mockTokenService.generateToken).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando a senha estiver incorreta', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(mockUser),
    );
    mockHashService.compare.mockResolvedValue(false);

    const result = await sut.authenticate(email, password);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid password');
    expect(result.data).toBeUndefined();
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockHashService.compare).toHaveBeenCalledWith(
      password,
      hashedPassword,
    );
    expect(mockTokenService.generateToken).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o repositório falhar', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.failure('Database error'),
    );

    const result = await sut.authenticate(email, password);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(result.data).toBeUndefined();
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockHashService.compare).not.toHaveBeenCalled();
    expect(mockTokenService.generateToken).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o serviço de token falhar', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      ResultHelper.success(mockUser),
    );
    mockHashService.compare.mockResolvedValue(true);
    mockTokenService.generateToken.mockRejectedValue(
      new Error('Authentication failed'),
    );

    const result = await sut.authenticate(email, password);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication failed');
    expect(result.data).toBeUndefined();
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockHashService.compare).toHaveBeenCalledWith(
      password,
      hashedPassword,
    );
    expect(mockTokenService.generateToken).toHaveBeenCalledWith(userId);
  });
});
