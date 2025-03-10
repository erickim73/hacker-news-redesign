import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import storiesReducer from './storiesSlice';
import userReducer from './userSlice'
import commentsReducer from './commentsSlice'

// config for redux persist
const persistConfig = {
    key: 'hackernews',
    storage,
    whitelist: ['readStories', 'starredStories', 'hiddenStories'],
};

const persistedStoriesReducer = persistReducer(persistConfig, storiesReducer);

export const store = configureStore({
    reducer: {
        stories: persistedStoriesReducer,
        user: userReducer,
        comments: commentsReducer, 
    },
    
    // ignore serializable checks for persist-related actions
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
})

export const persistor = persistStore(store);

// set up listener for redux query, allowing automatic refetching and synchronization of state
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;