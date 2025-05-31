import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  let jwtTokenService: JwtTokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    jwtTokenService = moduleRef.get<JwtTokenService>(JwtTokenService);
    jwtService = moduleRef.get<JwtService>(JwtService);
  });

  it('deve gerar um token JWT para um ID de usuário válido', async () => {
    const userId = 'user-123';
    const expectedToken = 'jwt-token-123';

    jest.spyOn(jwtService, 'sign').mockReturnValue(expectedToken);

    const token = await jwtTokenService.generateToken(userId);

    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: userId },
      { secret: 'secret', expiresIn: '1h' },
    );
    expect(token).toBe(expectedToken);
  });

  it('deve validar um token JWT e retornar o ID do usuário', async () => {
    const token = 'valid-token';
    const decodedToken = { sub: 'user-123' };

    jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);

    const userId = await jwtTokenService.validateToken(token);

    expect(jwtService.verify).toHaveBeenCalledWith(token);
    expect(userId).toBe(decodedToken.sub);
  });

  it('deve retornar null quando o token for inválido', async () => {
    const invalidToken = 'invalid-token';

    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const result = await jwtTokenService.validateToken(invalidToken);

    expect(jwtService.verify).toHaveBeenCalledWith(invalidToken);
    expect(result).toBeNull();
  });
});
