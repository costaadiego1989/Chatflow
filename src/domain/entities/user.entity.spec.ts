import { User } from './user.entity';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-id-123'),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const makeSut = () => {
  return new User('user-123', 'test@example.com', 'testuser', 'password123');
};

describe('User Entity', () => {
  it('deve criar um usuário válido com todos os campos obrigatórios', () => {
    const sut = makeSut();

    expect(sut.id).toBeDefined();
    expect(sut.email).toBe('test@example.com');
    expect(sut.username).toBe('testuser');
    expect(sut.password).toBe('password123');
  });

  it('deve lançar erro se email for inválido', () => {
    expect(() => new User('user-123', 'invalid-email', 'testuser', 'password123')).toThrow(
      'Email inválido',
    );
  });

  it('deve lançar erro se username for muito curto', () => {
    expect(() => new User('user-123', 'test@example.com', 'ab', 'password123'))
      .toThrow('Nome de usuário deve ter pelo menos 3 caracteres');
  });

  it('deve lançar erro se senha for muito curta', () => {
    expect(() => new User('user-123', 'test@example.com', 'testuser', '12345'))
      .toThrow('Senha deve ter pelo menos 6 caracteres');
  });

  it('deve lançar erro se o email não for fornecido', () => {
    expect(() => new User('user-123', '', 'testuser', 'password123')).toThrow('Email inválido');
  });

  it('deve lançar erro se o username não for fornecido', () => {
    expect(() => new User('user-123', 'test@example.com', '', 'password123')).toThrow('Nome de usuário deve ter pelo menos 3 caracteres');
  });

  it('deve lançar erro se a senha não for fornecida', () => {
    expect(() => new User('user-123', 'test@example.com', 'testuser', '')).toThrow('Senha deve ter pelo menos 6 caracteres');
  });

  it('deve ter um status padrão como offline', () => {
    const sut = makeSut();
    expect(sut.status).toBe('offline');
  });

  it('deve ser possível alterar o status para online', () => {
    const sut = makeSut();
    sut.status = 'online';
    expect(sut.status).toBe('online');
  });

  it('deve permitir definir um avatar', () => {
    const sut = makeSut();
    const avatarUrl = 'https://example.com/avatar.jpg';

    sut.avatar = avatarUrl;
    expect(sut.avatar).toBe(avatarUrl);
  });

  it('deve ter uma data de último acesso (lastSeen)', () => {
    const sut = makeSut();
    expect(sut.lastSeen).toBeInstanceOf(Date);
  });

  it('deve atualizar o status e lastSeen ao chamar goOnline', () => {
    const sut = makeSut();
    const initialLastSeen = sut.lastSeen;

    jest.advanceTimersByTime(1000);

    sut.goOnline();

    expect(sut.status).toBe('online');
    expect(sut.lastSeen).not.toBe(initialLastSeen);
  });

  it('deve atualizar o status para offline ao chamar goOffline', () => {
    const sut = makeSut();
    sut.goOnline();

    jest.advanceTimersByTime(1000);

    sut.goOffline();

    expect(sut.status).toBe('offline');
  });
});
