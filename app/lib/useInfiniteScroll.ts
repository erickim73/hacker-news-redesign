import { useEffect, useState } from 'react'

// hook to implement infinite scrolling
export function useInfiniteScroll(
    callback: () => void,
    options: {
        threshold?: number 
        disabled?: boolean 
    } = {}
) {
    const { threshold = 300, disabled = false } = options
    const [loading, setLoading] = useState<boolean>(false)
    
    useEffect(() => {
        // early return if infinite scrolling is disabled
        if (disabled) return
        
        const handleScroll = () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
            const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
            const clientHeight = document.documentElement.clientHeight || window.innerHeight
            
            // If near bottom and not already loading, trigger callback
            if (scrollHeight - scrollTop - clientHeight < threshold && !loading) {
                setLoading(true)
                callback()
                
                // reset loading state after delay to prevent multiple calls
                setTimeout(() => {
                setLoading(false)
                }, 1000)
            }
        }
    
        // add scroll event listener
        window.addEventListener('scroll', handleScroll)
        
        // clean up event listener on unmount
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [callback, threshold, disabled, loading])
    
    return { loading }
}