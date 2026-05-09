import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  status: string
  created_at: string
  teacher_justification: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: Role
  user: User
}

export function registerStudent(data: { email: string; full_name: string; password: string }) {
  return api.post('/auth/register/student', data)
}

export function registerTeacher(data: { email: string; full_name: string; password: string; teacher_justification: string }) {
  return api.post('/auth/register/teacher', data)
}

export async function login(data: { email: string; password: string }): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data)
  return response.data
}

export function getMe(token: string): Promise<User> {
  return api.get<User>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data)
}