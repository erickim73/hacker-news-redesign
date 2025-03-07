import React, {useState} from 'react'
import {Comment as CommentType} from '../lib/api'

interface CommentProps {
    comment: CommentType;
    depth?: number
}

// gets comment with nested replies
const Comment: React.FC<CommentProps> = ({comment, depth = 0}) => {
    const [expanded, setExpanded] = useState<boolean>(true)

    // format timestamp to easy to read format
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // render html safely
    const createMarkup = (html: string) => {
        return {__html: html}
    }

    // toggle see more comments
    const toggleExpanded = () => {
        setExpanded(!expanded)
    }

    // set limit to indentation
    const maxIndent = 5
    const indentLevel = depth > maxIndent ? maxIndent : depth

    return (
        <div className={`mt-2 pl-${indentLevel * 4}`}>
            <div className="border-l-2 border-gray-300 dark:border-gray-700 pl-3">
                {/* comment header */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{comment.by}</span>
                    <span>·</span>
                    <span>{formatDate(comment.time)}</span>
                    <button 
                        onClick={toggleExpanded} 
                        className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        [{expanded ? 'collapse' : 'expand'}]
                    </button>
                </div>
                
                {/* comment content */}
                {expanded && (
                <div 
                    className="mt-1 text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={comment.text ? createMarkup(comment.text) : { __html: '<em>No content</em>' }}
                />
                )}
                
                {/* nested replies */}
                {expanded && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                        {comment.replies.map((reply) => (
                        <Comment key={reply.id} comment={reply} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Comment