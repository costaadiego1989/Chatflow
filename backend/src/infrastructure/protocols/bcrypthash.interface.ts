export interface IBcryptHashService {
  hash(password: string): Promise<string>;
}
