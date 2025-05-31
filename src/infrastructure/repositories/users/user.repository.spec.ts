import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from '../../database/prisma.service';
import { User } from '../../../domain/entities/user.entity';
import { ResultHelper } from '../../../helpers/result-helper';

describe('UserRepository', () => {
  let repository: UserRepository;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const userId = 'user-123';
  const userEmail = 'test@example.com';
  const username = 'testuser';
  const userPassword = 'hashedpassword';

  const userModelMock = {
    id: userId,
    email: userEmail,
    username: username,
    password: userPassword,
    status: 'OFFLINE',
    avatar: null,
    lastSeen: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  describe('UserRepository', () => {
    it('deve retornar um usuário quando encontrado pelo ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(userModelMock);

      const result = await repository.findById(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(userId);
      expect(result.data.email).toBe(userEmail);
      expect(result.data.username).toBe(username);
      expect(result.data.password).toBe(userPassword);
    });

    it('deve retornar erro quando usuário não for encontrado pelo ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('usuário-inexistente');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'usuário-inexistente' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('findByEmail', () => {
    it('deve retornar um usuário quando encontrado pelo email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(userModelMock);

      const result = await repository.findByEmail(userEmail);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: userEmail },
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(userId);
      expect(result.data.email).toBe(userEmail);
      expect(result.data.username).toBe(username);
      expect(result.data.password).toBe(userPassword);
    });

    it('deve retornar sucesso com null quando usuário não for encontrado pelo email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail(
        'email-inexistente@example.com',
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'email-inexistente@example.com' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  it('deve retornar um usuário quando encontrado pelo nome de usuário', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(userModelMock);

    const result = await repository.findByUsername(username);

    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { username },
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(userId);
    expect(result.data.email).toBe(userEmail);
    expect(result.data.username).toBe(username);
    expect(result.data.password).toBe(userPassword);
  });

  it('deve retornar sucesso com null quando usuário não for encontrado pelo nome de usuário', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    const result = await repository.findByUsername('usuário-inexistente');

    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'usuário-inexistente' },
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  describe('save', () => {
    it('deve salvar e retornar um novo usuário', async () => {
      const newUser = new User(userId, userEmail, username, userPassword);
      mockPrismaService.user.create.mockResolvedValue(userModelMock);

      const result = await repository.save(newUser);

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data).toMatchObject({
        id: userId,
        email: userEmail,
        username: username,
        password: userPassword,
        status: newUser.status,
        avatar: null,
      });

      expect(createCall.data.lastSeen).toBeInstanceOf(Date);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(userId);
      expect(result.data.email).toBe(userEmail);
      expect(result.data.username).toBe(username);
      expect(result.data.password).toBe(userPassword);
    });
  });

  it('deve atualizar e retornar um usuário existente', async () => {
    const updatedUser = new User(
      userId,
      'novo@example.com',
      'novousuario',
      userPassword,
    );
    updatedUser.status = 'ONLINE';
    updatedUser.avatar = 'novo-avatar.jpg';

    mockPrismaService.user.update.mockResolvedValue({
      id: userId,
      email: 'novo@example.com',
      username: 'novousuario',
      password: userPassword,
      status: 'ONLINE',
      avatar: 'novo-avatar.jpg',
      lastSeen: null,
    });

    const result = await repository.update(userId, updatedUser);

    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        email: 'novo@example.com',
        username: 'novousuario',
        password: userPassword,
        status: 'ONLINE',
        avatar: 'novo-avatar.jpg',
      },
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(userId);
    expect(result.data.email).toBe('novo@example.com');
    expect(result.data.username).toBe('novousuario');
    expect(result.data.status).toBe('ONLINE');
    expect(result.data.avatar).toBe('novo-avatar.jpg');
  });

  it('deve excluir um usuário pelo ID', async () => {
    mockPrismaService.user.delete.mockResolvedValue(undefined);

    const result = await repository.delete(userId);

    expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
      where: { id: userId },
    });

    expect(result.success).toBe(true);
  });
});
