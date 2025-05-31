import { User } from "../../../domain/entities/User";
import { AuthPort } from "../../../domain/ports/AuthPort";
import { UserFactory } from "../../../domain/factories/UserFactory";
import { HttpClient } from "./HttpClient";
import {
  RegisterRequest,
  LoginRequest,
} from "../../protocols/AuthApiAdapter.interface";

interface ApiUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
}

type ApiResponse = Record<string, unknown> & {
  user?: ApiUser;
  token?: string;
  data?: {
    user?: ApiUser;
    token?: string;
  };
};

export class AuthApiAdapter implements AuthPort {
  private httpClient: HttpClient;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.httpClient = new HttpClient(baseUrl);
  }

  getToken(): string | null {
    return this.token;
  }

  async register(user: User): Promise<User> {
    const request: RegisterRequest = {
      username: user.username,
      email: user.email,
      password: user.password || "",
    };

    const rawResponse = await this.makeRequest("/users", "POST", request);
    const response = await this.parseResponse(rawResponse);
    return this.processAuthResponse(response, user);
  }

  async login(email: string, password: string): Promise<User> {
    const request: LoginRequest = {
      email,
      password,
    };

    const rawResponse = await this.makeRequest("/auth/login", "POST", request);
    const response = await this.parseResponse(rawResponse);
    return this.processAuthResponse(response, new User("Usuário", email));
  }

  async logout(): Promise<void> {
    this.token = null;
    this.httpClient.removeToken();
  }

  private async makeRequest(endpoint: string, method: string, data?: unknown): Promise<Response> {
    return fetch(`${this.httpClient.getBaseUrl()}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async parseResponse(response: Response): Promise<ApiResponse> {
    const responseText = await response.text();
    
    try {
      return JSON.parse(responseText) as ApiResponse;
    } catch {
      throw new Error("Invalid response format from server");
    }
  }

  private processAuthResponse(response: ApiResponse, defaultUser: User): User {
    if (response.user && response.token) {
      this.updateToken(response.token);
      return UserFactory.createFromAPI(response.user);
    } else if (response.data?.user) {
      if (response.data.token) {
        this.updateToken(response.data.token);
      }
      return UserFactory.createFromAPI(response.data.user);
    } else {
      return new User(
        defaultUser.username,
        defaultUser.email,
        undefined,
        defaultUser.id || "temp-id",
        this.token
      );
    }
  }

  private updateToken(token: string): void {
    this.token = token;
    this.httpClient.setToken(this.token);
  }
}
