import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthenticateUserUseCase } from '../../../../application/use-cases/auth/authenticate-user.use-case';
import { AuthRequestDto } from '../../dtos/auth/auth-request.dto';
import { User } from '../../../../domain/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authenticateUserUseCase: jest.Mocked<AuthenticateUserUseCase>;

  beforeEach(async () => {
    authenticateUserUseCase = {
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<AuthenticateUserUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthenticateUserUseCase,
          useValue: authenticateUserUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('deve retornar token e informações do usuário quando a autenticação for bem sucedida', async () => {
    const loginDto: AuthRequestDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const userId = 'user-123';
    const mockUser = new User(
      userId,
      'test@example.com',
      'testuser',
      'hashed_password',
    );
    const mockToken = 'jwt-token-123';

    authenticateUserUseCase.authenticate.mockResolvedValue({
      success: true,
      data: {
        token: mockToken,
        user: mockUser,
      },
    });

    const result = await controller.login(loginDto);

    expect(authenticateUserUseCase.authenticate).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );

    expect(result).toEqual({
      success: true,
      data: {
        token: mockToken,
        user: {
          id: userId,
          email: mockUser.email,
          username: mockUser.username,
        },
      },
    });
  });

  it('deve retornar um objeto de falha quando a autenticação falhar', async () => {
    const loginDto: AuthRequestDto = {
      email: 'usuario@teste.com',
      password: 'senha-incorreta',
    };

    const errorMessage = 'Credenciais inválidas';

    authenticateUserUseCase.authenticate.mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    const result = await controller.login(loginDto);

    expect(authenticateUserUseCase.authenticate).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );

    expect(result).toEqual({
      success: false,
      error: errorMessage,
    });
  });

  it('deve retornar um objeto de falha quando ocorrer um erro inesperado', async () => {
    const loginDto: AuthRequestDto = {
      email: 'usuario@teste.com',
      password: 'senha123',
    };

    const errorMessage = 'Erro interno';
    authenticateUserUseCase.authenticate.mockRejectedValue(
      new Error(errorMessage),
    );

    const result = await controller.login(loginDto);

    expect(authenticateUserUseCase.authenticate).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );

    expect(result).toEqual({
      success: false,
      error: errorMessage,
    });
  });
});
