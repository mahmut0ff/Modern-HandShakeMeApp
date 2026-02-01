import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: number
  phone: string
  role: 'CLIENT' | 'MASTER' | 'ADMIN' // FIXED: Match Lambda format
  firstName?: string
  lastName?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload
      
      // Validate user role
      const validRoles = ['CLIENT', 'MASTER', 'ADMIN'] // FIXED: Match Lambda format
      if (!user || !validRoles.includes(user.role)) {
        console.error('Invalid user role:', user?.role)
        return
      }
      
      // SECURITY FIX: Validate JWT tokens
      if (!accessToken || !refreshToken) {
        console.error('Missing authentication tokens')
        return
      }
      
      // Basic JWT format validation
      const isValidJWT = (token: string) => {
        const parts = token.split('.')
        return parts.length === 3 && parts.every(part => part.length > 0)
      }
      
      if (!isValidJWT(accessToken) || !isValidJWT(refreshToken)) {
        console.error('Invalid JWT token format')
        return
      }
      
      state.user = user
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.isAuthenticated = true
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    },
  },
})

export const { setCredentials, setTokens, logout } = authSlice.actions
export default authSlice.reducer