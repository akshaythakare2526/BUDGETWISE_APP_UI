export interface User {
  id?: string;
  name?: string;
  userName: string;
  email: string;
  phone?: string;
  role?: number; // 0 for User, 1 for Admin
}

// Login response interface to match your backend
export interface LoginResponse {
  email: string;
  name: string;
  token: string;
  userId: string;
  userName: string;
  phone?: string; // Added phone field
}

export interface RegisterRequest {
  Name: string;
  UserName: string;
  Email: string;
  Password: string;
  Phone: string;
  Role: number;
}

export interface LoginRequest {
  UserName: string;  // Changed from Email to UserName to match backend
  Password: string;
}