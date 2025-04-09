import { combineReducers, configureStore } from '@reduxjs/toolkit';
import userReducer from './UserSlice';

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';


// Combine reducers
const rootReducer = combineReducers({ 
  user: userReducer,
 
});

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  version: 1,
};

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Persistor
export const persistor = persistStore(store);
