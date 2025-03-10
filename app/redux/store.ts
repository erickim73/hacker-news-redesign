import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import storiesReducer from './storiesSlice';
import userReducer from './userSlice'
import commentsReducer from './commentsSlice'

const persistConfig = {
    key: 'hackernews',
    storage,
    // only persist these keys
    whitelist: ['readStories', 'starredStories', 'hiddenStories'],
};

const persistedStoriesReducer = persistReducer(persistConfig, storiesReducer);

export const store = configureStore({
    reducer: {
        stories: persistedStoriesReducer,
        user: userReducer,
        comments: commentsReducer, 
    },
    // recommend middleware setup
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;