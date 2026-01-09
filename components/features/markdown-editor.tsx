'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'
import { useRef, useEffect } from 'react'

import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (_value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  ariaLabel,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    // Handle tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }

    // Handle Cmd/Ctrl+B for bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const newValue = value.substring(0, start) + `**${selectedText}**` + value.substring(end)
      onChange(newValue)

      // Position cursor inside bold markers if no selection
      if (start === end) {
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel || 'Movement content'}
      className={cn(
        'w-full px-3 py-2 text-sm',
        'bg-transparent border-none outline-hidden resize-none',
        'placeholder:text-muted-foreground',
        'min-h-[200px]',
        className,
      )}
    />
  )
}
