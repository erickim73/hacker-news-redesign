import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Story } from '../lib/api';

interface StoriesState {
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
    currentStory: Story | null;
  }

const initialState: StoriesState = {
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
    currentStory: null,
};

const storiesSlice = createSlice({
    name: 'stories',
    initialState,
    reducers: {
        setStories: (state, action: PayloadAction<Story[]>) => {
            state.stories = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
        },
        setHasMore: (state, action: PayloadAction<boolean>) => {
            state.hasMore = action.payload;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
        },
        setStoryIds: (state, action: PayloadAction<number[]>) => {
            state.storyIds = action.payload;
        },
        setReadStories: (state, action: PayloadAction<number[]>) => {
            state.readStories = action.payload;
        },
        setStarredStories: (state, action: PayloadAction<number[]>) => {
            state.starredStories = action.payload;
        },
        setHiddenStories: (state, action: PayloadAction<number[]>) => {
            state.hiddenStories = action.payload;
        },

        // actions for storydetail page
        fetchStoryStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        
        fetchStorySuccess: (state, action) => {
            state.currentStory = action.payload;
            state.loading = false;
            state.error = null;
        },
        fetchStoryFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        markAsRead: (state, action) => {
            const storyId = action.payload;
            if (!state.readStories.includes(storyId)) {
                state.readStories.push(storyId);
            }
            
            // Update currentStory if it's loaded
            if (state.currentStory && state.currentStory.id === storyId) {
                state.currentStory.isRead = true;
            }
            
            // Update any matching story in the stories array
            state.stories = state.stories.map(story => 
                story.id === storyId ? {...story, isRead: true} : story
            );
        },

        toggleStar: (state, action) => {
            const storyId = action.payload;
            const isCurrentlyStarred = state.starredStories.includes(storyId);
            
            if (isCurrentlyStarred) {
                // Remove from starred stories
                state.starredStories = state.starredStories.filter(id => id !== storyId);
            } else {
                // Add to starred stories
                state.starredStories.push(storyId);
            }

            // Update currentStory if it's loaded
            if (state.currentStory && state.currentStory.id === storyId) {
                state.currentStory.isStarred = !isCurrentlyStarred;
            }
            
            // Update any matching story in the stories array
            state.stories = state.stories.map(story => 
                story.id === storyId ? {...story, isStarred: !isCurrentlyStarred} : story
            );
            
            // Remove from stories list if in starred tab and unstarring
            if (state.activeTab === "starred" && isCurrentlyStarred) {
                state.stories = state.stories.filter(story => story.id !== storyId);
            }
        },

        hideStory: (state, action) => {
            const storyId = action.payload;
            
            // Add to hidden stories if not already there
            if (!state.hiddenStories.includes(storyId)) {
                state.hiddenStories.push(storyId);
            }
            
            // Remove from stories list
            state.stories = state.stories.filter(story => story.id !== storyId);
          },
    },
});

export const {
    // homepage
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

    // storydetails page
    fetchStoryStart,
    fetchStorySuccess,
    fetchStoryFailure,

    // shared
    markAsRead,
    toggleStar,
    hideStory
} = storiesSlice.actions;

export default storiesSlice.reducer;
