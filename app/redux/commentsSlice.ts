import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Comment as CommentType} from '../lib/api'

interface CommentState {
    comments: CommentType[];
    loading: boolean;
    error: string | null;
    visibleComments: number;
    expandedComments: Record<string, boolean>
}

const initialState: CommentState = {
    comments: [],
    loading: true,
    error: null,
    visibleComments: 10,
    expandedComments: {},
}

export const commentsSlice = createSlice ({
    name: 'comments',
    initialState,
    reducers: {
        setComments: (state, action: PayloadAction<CommentType[]>) => {
            state.comments = action.payload
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        increaseVisibleComments: (state, action: PayloadAction<number>) => {
            state.visibleComments += action.payload;
        },
        toggleCommentExpansion: (state, action: PayloadAction<string | number>) => {
            const commentId = action.payload;
            // If not explicitly set (undefined) or true, it's considered expanded
            const currentlyExpanded = state.expandedComments[commentId] !== false;
            state.expandedComments[commentId] = !currentlyExpanded;
        },
        setAllCommentsExpanded: (state, action: PayloadAction<boolean>) => {
            const setExpandedForComment = (comment: CommentType, isExpanded: boolean) => {
                state.expandedComments[comment.id] = isExpanded;
                if (comment.replies) {
                    comment.replies.forEach(reply => setExpandedForComment(reply, isExpanded));
                }
            };
            state.comments.forEach(comment => setExpandedForComment(comment, action.payload));
        },
        resetCommentState: (state) => {
            state.comments = [];
            state.loading = true;
            state.visibleComments = 10;
            state.expandedComments = {};
        },
    }
})

export const { setComments, setLoading, setError, increaseVisibleComments,resetCommentState, toggleCommentExpansion, setAllCommentsExpanded} = commentsSlice.actions;

export default commentsSlice.reducer;