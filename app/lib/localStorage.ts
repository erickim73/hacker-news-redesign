import {useState, useEffect} from 'react'

// custom hook for using local storage for data
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue
        } try {
            // get from local storage with key
            const item = window.localStorage.getItem(key)
            return item? JSON.parse(item) : initialValue
        } catch (error) {
            console.error('Error reading local storage key "${key}', error)
            return initialValue
        }
    })

    const setValue = (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value

            // save state
            setStoredValue(valueToStore)

            // save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}": `, error)
        }
    }
    
    // change state if local storage changes in another tab
    useEffect(() => {
        function handleStorageChange(event: StorageEvent) {
            if (event.key === key) {
                try {
                    const newValue = event.newValue ? JSON.parse(event.newValue) : initialValue
                    setStoredValue(newValue)
                } catch (error) {
                    console.error(`Error parsing localStorage change for key "${key}":`, error)
                }
            }
        }

        // listen for changes to local storage
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange)
            return () => window.removeEventListener('storage', handleStorageChange)
        }
    }, [key, initialValue])

    return [storedValue, setValue]
}