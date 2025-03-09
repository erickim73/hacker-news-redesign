import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Story } from '../lib/api';

interface StoryState {
    stories: Story[];
    loading: boolean;
    error: string | null;
    activeTab: string;
    hasMore: boolean;
    page: number;
    storyIds: number[];
    readStories: number[];
    starredStories: number[];
    hiddenStories: number[];
}

const initialState: StoryState = {
    stories: [],
    loading: true,
    error: null,
    activeTab: "top",
    hasMore: true,
    page: 1,
    storyIds: [],
    readStories: [],
    starredStories: [],
    hiddenStories: [],
};

const storiesSlice = createSlice({
    name: 'stories',
    initialState,
    reducers: {
        setStories: (state: StoryState, action: PayloadAction<Story[]>) => {
        state.stories = action.payload;
        },
        setLoading: (state: StoryState, action: PayloadAction<boolean>) => {
        state.loading = action.payload;
        },
        setError: (state: StoryState, action: PayloadAction<string | null>) => {
        state.error = action.payload;
        },
        setActiveTab: (state: StoryState, action: PayloadAction<string>) => {
        state.activeTab = action.payload;
        },
        setHasMore: (state: StoryState, action: PayloadAction<boolean>) => {
        state.hasMore = action.payload;
        },
        setPage: (state: StoryState, action: PayloadAction<number>) => {
        state.page = action.payload;
        },
        setStoryIds: (state: StoryState, action: PayloadAction<number[]>) => {
        state.storyIds = action.payload;
        },
        setReadStories: (state: StoryState, action: PayloadAction<number[]>) => {
        state.readStories = action.payload;
        },
        setStarredStories: (state: StoryState, action: PayloadAction<number[]>) => {
        state.starredStories = action.payload;
        },
        setHiddenStories: (state: StoryState, action: PayloadAction<number[]>) => {
        state.hiddenStories = action.payload;
        },
    },
});

export const {
    setStories,
    setLoading,
    setError,
    setActiveTab,
    setHasMore,
    setPage,
    setStoryIds,
    setReadStories,
    setStarredStories,
    setHiddenStories,
} = storiesSlice.actions;

export default storiesSlice.reducer;
