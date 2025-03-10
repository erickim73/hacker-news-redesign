import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {User, Story} from '../lib/api'

interface UserState {
    user: User | null;
    userStories: Story[];
    loading: boolean;
    error: string | null;
    initialDataLoaded: boolean;
}

const initialState: UserState = {
    user: null,
    userStories: [],
    loading: true,
    error: null,
    initialDataLoaded: false
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state: UserState, action: PayloadAction<User | null>) => {
            state.user = action.payload
        },

        setUserStories: (state: UserState, action: PayloadAction<Story[]>) => {
            state.userStories = action.payload
        },

        setLoading: (state: UserState, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },

        setError: (state: UserState, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        setInitialDataLoaded: (state: UserState, action: PayloadAction<boolean>) => {
            state.initialDataLoaded = action.payload;
        }
    }
})

export const {
    setUser,
    setUserStories,
    setLoading,
    setError,
    setInitialDataLoaded
  } = userSlice.actions;
  
export default userSlice.reducer;