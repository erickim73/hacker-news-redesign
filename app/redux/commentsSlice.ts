import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Comment as CommentType} from '../lib/api'

interface CommentState {
    comments: CommentType[];
    loading: boolean;
    error: string | null;
    visibleComments: number;
    expandedComments: Record<string, boolean>
    loadingComments: Record<string | number, boolean>;
    allCommentIds: number[];
    loadedCommentBatches: number;
    commentsPerBatch: number;
    maxVisibleDepth: number;
}

const initialState: CommentState = {
    comments: [],
    loading: true,
    error: null,
    visibleComments: 10,
    expandedComments: {},
    loadingComments: {},
    allCommentIds: [],
    loadedCommentBatches: 1,
    commentsPerBatch: 10,
    maxVisibleDepth: 4,
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
            // if not explicitly set (undefined) or true, it's considered expanded
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

        updateCommentReplies: (state, action: PayloadAction<{ commentId: number, replies: CommentType[] }>) => {
            const { commentId, replies } = action.payload
            
            // helper function to find and update a comment in the nested structure
            const updateCommentInTree = (comments: CommentType[], targetId: number, newReplies: CommentType[]): boolean => {
                for (let i = 0; i < comments.length; i++) {
                    if (comments[i].id === targetId) {
                        // found the comment, update it
                        comments[i].replies = newReplies
                        comments[i].hasUnloadedReplies = false
                        return true
                    }
                    
                    // check if this comment has replies to recursively search
                    if (comments[i].replies?.length) {                        
                        // recurisvely search in the replies
                        if (updateCommentInTree(comments[i].replies!, targetId, newReplies)) {
                            return true
                        }
                    }
                }
                
                return false // not found in this branch
            }
            
            // try to update the comment in the tree
            updateCommentInTree(state.comments, commentId, replies)
        },

        setAllCommentIds: (state, action: PayloadAction<number[]>) => {
            state.allCommentIds = action.payload;
        },

        appendComments: (state, action: PayloadAction<CommentType[]>) => {
            state.comments = [...state.comments, ...action.payload];
        },

        increaseLoadedBatches: (state) => {
            state.loadedCommentBatches += 1;
        },

        resetLoadedBatches: (state) => {
            state.loadedCommentBatches = 1;
        },

        setCommentsPerBatch: (state, action: PayloadAction<number>) => {
            state.commentsPerBatch = action.payload;
        },

        setCommentLoading: (state, action: PayloadAction<{ commentId: number, isLoading: boolean }>) => {
            state.loadingComments = {
              ...state.loadingComments,
              [action.payload.commentId]: action.payload.isLoading
            };
        },
    }
})

export const { 
    setComments, 
    setLoading, 
    setError, 
    increaseVisibleComments,
    resetCommentState, 
    toggleCommentExpansion, 
    setAllCommentsExpanded, 
    updateCommentReplies,
    setAllCommentIds,
    appendComments,
    increaseLoadedBatches,
    resetLoadedBatches,
    setCommentsPerBatch
} = commentsSlice.actions;
export default commentsSlice.reducer;