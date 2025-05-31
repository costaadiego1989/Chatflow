import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { CreateUserUseCase } from '../../../../application/use-cases/users/create-user.use-case';
import { ResultHelper } from '../../../../helpers/result-helper';
import { User } from '../../../../domain/entities/user.entity';
import { FindUserByIdUseCase } from '../../../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../../../application/use-cases/users/update-user.use-case';
import { FindUserByUsernameUseCase } from '../../../../application/use-cases/users/find-user-by-username.use-case';
import { DeleteUserUseCase } from '../../../../application/use-cases/users/delete-user.use-case';
import { ValidateEmail } from '../../../../helpers/validate-email';

describe('UsersController', () => {
  let controller: UsersController;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let findUserByIdUseCase: jest.Mocked<FindUserByIdUseCase>;
  let updateUserUseCase: jest.Mocked<UpdateUserUseCase>;
  let findUserByUsernameUseCase: jest.Mocked<FindUserByUsernameUseCase>;
  let deleteUserUseCase: jest.Mocked<DeleteUserUseCase>;
  let validateEmail: jest.Mocked<ValidateEmail>;
  
  beforeEach(async () => {
    createUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateUserUseCase>;

    findUserByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindUserByIdUseCase>;

    updateUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateUserUseCase>;

    findUserByUsernameUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindUserByUsernameUseCase>;

    deleteUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteUserUseCase>;

    validateEmail = {
      validate: jest.fn().mockImplementation((email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }),
    } as unknown as jest.Mocked<ValidateEmail>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: createUserUseCase,
        },
        {
          provide: FindUserByIdUseCase,
          useValue: findUserByIdUseCase,
        },
        {
          provide: UpdateUserUseCase,
          useValue: updateUserUseCase,
        },
        {
          provide: FindUserByUsernameUseCase,
          useValue: findUserByUsernameUseCase,
        },
        {
          provide: DeleteUserUseCase,
          useValue: deleteUserUseCase,
        },
        {
          provide: ValidateEmail,
          useValue: validateEmail,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('create', () => {
    it('deve criar um novo usuário com sucesso e retornar 201', async () => {
      const createUserDto = {
        email: 'teste@exemplo.com',
        username: 'testuser',
        password: 'senha123',
      };

      const createdUser = new User(
        'user-123',
        createUserDto.email,
        createUserDto.username,
        'hashed_password',
      );

      createUserUseCase.execute.mockResolvedValue(
        ResultHelper.success(createdUser),
      );

      const result = await controller.create(createUserDto);

      expect(createUserUseCase.execute).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        success: true,
        data: {
          id: createdUser.id,
          email: createdUser.email,
          username: createdUser.username,
        },
      });
    });

    it('deve retornar falha quando a criação do usuário falhar', async () => {
      const createUserDto = {
        email: 'teste@exemplo.com',
        username: 'testuser',
        password: 'senha123',
      };

      const errorMessage = 'Email already in use';
      createUserUseCase.execute.mockResolvedValue(
        ResultHelper.failure(errorMessage),
      );

      const result = await controller.create(createUserDto);

      expect(createUserUseCase.execute).toHaveBeenCalledWith(createUserDto);
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('deve retornar falha para email inválido', async () => {
      const createUserDto = {
        email: 'emailinvalido',
        username: 'testuser',
        password: 'senha123',
      };

      const result = await controller.create(createUserDto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email is required and must be valid');
    });

    it('deve retornar falha para username vazio', async () => {
      const createUserDto = {
        email: 'teste@exemplo.com',
        username: '',
        password: 'senha123',
      };

      const result = await controller.create(createUserDto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username is required');
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário quando encontrado pelo ID', async () => {
      const userId = 'user-123';
      const mockUser = new User(
        userId,
        'teste@exemplo.com',
        'testuser',
        'hashed_password',
      );

      findUserByIdUseCase.execute.mockResolvedValue(
        ResultHelper.success(mockUser),
      );

      const result = await controller.findById(userId);

      expect(findUserByIdUseCase.execute).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        success: true,
        data: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
      });
    });

    it('deve retornar falha quando o usuário não for encontrado', async () => {
      const userId = 'user-inexistente';
      const errorMessage = 'User not found';

      findUserByIdUseCase.execute.mockResolvedValue(
        ResultHelper.failure(errorMessage),
      );

      const result = await controller.findById(userId);

      expect(findUserByIdUseCase.execute).toHaveBeenCalledWith(userId);
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('deve retornar falha quando o ID for vazio', async () => {
      const userId = '';

      const result = await controller.findById(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });
  });

  describe('findByUsername', () => {
    it('deve retornar um usuário quando encontrado pelo username', async () => {
      const username = 'testuser';
      const mockUser = new User(
        'user-123',
        'teste@exemplo.com',
        username,
        'hashed_password',
      );

      findUserByUsernameUseCase.execute.mockResolvedValue(
        ResultHelper.success(mockUser),
      );

      const result = await controller.findByUsername(username);

      expect(findUserByUsernameUseCase.execute).toHaveBeenCalledWith(username);
      expect(result).toEqual({
        success: true,
        data: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
      });
    });

    it('deve retornar falha quando o usuário não for encontrado pelo username', async () => {
      const username = 'usuarioinexistente';
      const errorMessage = `User with username '${username}' not found`;

      findUserByUsernameUseCase.execute.mockResolvedValue(
        ResultHelper.failure(errorMessage),
      );

      const result = await controller.findByUsername(username);

      expect(findUserByUsernameUseCase.execute).toHaveBeenCalledWith(username);
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('deve retornar falha quando o username for vazio', async () => {
      const username = '';

      const result = await controller.findByUsername(username);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username is required');
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário e retornar os dados atualizados', async () => {
      const userId = 'user-123';
      const updateUserDto = {
        username: 'novousername',
        email: 'novo@email.com',
      };

      const updatedUser = new User(
        userId,
        updateUserDto.email,
        updateUserDto.username,
        'hashed_password',
      );

      updateUserUseCase.execute.mockResolvedValue(
        ResultHelper.success(updatedUser),
      );

      const result = await controller.update(userId, updateUserDto);

      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
        },
      });
    });
    
    it('deve retornar falha quando o ID for vazio', async () => {
      const userId = '';
      const updateUserDto = {
        username: 'novousername',
        email: 'novo@email.com',
      };

      const result = await controller.update(userId, updateUserDto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });
    
    it('deve retornar falha quando a atualização do usuário falhar', async () => {
      const userId = 'user-123';
      const updateUserDto = {
        username: 'novousername',
        email: 'novo@email.com',
      };
      const errorMessage = 'User not found';
      
      updateUserUseCase.execute.mockResolvedValue(
        ResultHelper.failure(errorMessage),
      );

      const result = await controller.update(userId, updateUserDto);

      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        userId, 
        updateUserDto
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('delete', () => {
    it('deve deletar um usuário e retornar 204', async () => {
      const userId = 'user-123';

      deleteUserUseCase.execute.mockResolvedValue(ResultHelper.success(true));

      const result = await controller.delete(userId);

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        success: true,
        data: 'User deleted successfully',
      });
    });

    it('deve retornar falha quando o usuário não for encontrado', async () => {
      const userId = 'user-inexistente';
      const errorMessage = 'User not found';

      deleteUserUseCase.execute.mockResolvedValue(
        ResultHelper.failure(errorMessage),
      );

      const result = await controller.delete(userId);

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith(userId);
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
    
    it('deve retornar falha quando o ID for vazio', async () => {
      const userId = '';

      const result = await controller.delete(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });
  });
});
