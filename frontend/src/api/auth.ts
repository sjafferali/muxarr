import { api } from './client'

export interface AuthStatus {
  auth_required: boolean
  password_login: boolean
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const { data } = await api.get('/auth/status')
  return data
}

export async function login(username: string, password: string): Promise<string> {
  const { data } = await api.post('/auth/login', { username, password })
  return data.access_token as string
}
