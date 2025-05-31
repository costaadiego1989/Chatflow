export interface IJwtTokenService {
  generateToken(userId: string): Promise<string>;
  validateToken(token: string): Promise<any>;
}
