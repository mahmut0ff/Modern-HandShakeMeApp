import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { setupListeners } from '@reduxjs/toolkit/query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import authReducer from '../features/auth/authSlice'
import { api } from '../services/api'

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
}

const rootReducer = combineReducers({
  auth: authReducer,
  [api.reducerPath]: api.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', api.util.resetApiState.type],
      },
    }).concat(api.middleware),
})

// Enable listener behavior for the store
setupListeners(store.dispatch)

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch