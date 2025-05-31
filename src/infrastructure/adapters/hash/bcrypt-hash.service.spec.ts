import { Test, TestingModule } from '@nestjs/testing';
import { BcryptHashService } from './bcrypt-hash.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('BcryptHashService', () => {
  let service: BcryptHashService;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptHashService],
    }).compile();

    service = module.get<BcryptHashService>(BcryptHashService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar um hash de senha usando bcrypt', async () => {
    const senha = 'senha123';
    const hashMock = 'hash_gerado_pelo_bcrypt';

    mockBcrypt.hash.mockResolvedValue(hashMock as never);

    const resultado = await service.hash(senha);

    expect(mockBcrypt.hash).toHaveBeenCalledWith(senha, 10);
    expect(resultado).toBe(hashMock);
  });

  it('deve comparar senha com hash e retornar true quando corresponderem', async () => {
    const senha = 'senha123';
    const hash = 'hash_da_senha';

    mockBcrypt.compare.mockResolvedValue(true as never);

    const resultado = await service.compare(senha, hash);

    expect(mockBcrypt.compare).toHaveBeenCalledWith(senha, hash);
    expect(resultado).toBe(true);
  });
});
