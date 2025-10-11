import { useEffect } from 'react'

export function useHotkeys(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const metaKey = isMac ? event.metaKey : event.ctrlKey

      if (key === 'escape' && event.key === 'Escape') {
        event.preventDefault()
        callback()
      } else if (key === 'cmd+k' && metaKey && event.key === 'k') {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback])
}
