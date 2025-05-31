import { User } from "../../domain/entities/User";
import { ReactNode } from "react";

export interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<User | null>;
  logout: () => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}
