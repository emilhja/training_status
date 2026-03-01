import { useEffect } from 'react'
import type { NavigateFunction } from 'react-router-dom'

// Views in the order assigned to keys 1-9
const VIEW_KEYS: Record<string, string> = {
  '1': 'overview',
  '2': 'training',
  '3': 'health',
  '4': 'analysis',
  '5': 'running',
  '6': 'activities',
  '7': 'trends',
  '8': 'log',
  '9': 'gear',
}

export function useKeyboardShortcuts(
  onRefresh: () => void,
  navigate: NavigateFunction,
  onToggleHelp: () => void,
): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        onToggleHelp()
        return
      }

      if (e.key === 'r') {
        e.preventDefault()
        onRefresh()
        return
      }

      const view = VIEW_KEYS[e.key]
      if (view) {
        e.preventDefault()
        navigate(`/${view}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRefresh, navigate, onToggleHelp])
}
