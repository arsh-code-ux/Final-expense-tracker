import { useEffect, useRef, useState } from 'react'
import MarkdownPreview from './MarkdownPreview'

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  onExplain,
  onImprove,
  onDocs,
  placeholder = 'Write markdown notes here...'
}) {
  const textareaRef = useRef(null)
  const [localValue, setLocalValue] = useState(value || '')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const applyMarkdown = (before, after = '', placeholderText = 'text') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = localValue.substring(start, end) || placeholderText
    const newValue = `${localValue.slice(0, start)}${before}${selected}${after}${localValue.slice(end)}`

    setLocalValue(newValue)
    onChange(newValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursorStart = start + before.length
      const cursorEnd = cursorStart + selected.length
      textarea.setSelectionRange(cursorStart, cursorEnd)
    })
  }

  const handleChange = (event) => {
    const nextValue = event.target.value
    setLocalValue(nextValue)
    onChange(nextValue)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <button type="button" onClick={() => applyMarkdown('**', '**', 'bold text')} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold">Bold</button>
        <button type="button" onClick={() => applyMarkdown('*', '*', 'italic text')} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs italic">Italic</button>
        <button type="button" onClick={() => applyMarkdown('### ', '', 'Heading')} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold">H3</button>
        <button type="button" onClick={() => applyMarkdown('- ', '', 'list item')} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">List</button>
        <button type="button" onClick={() => applyMarkdown('```\n', '\n```', 'code')} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono">Code</button>
        <button type="button" onClick={() => setShowPreview((current) => !current)} className={`rounded-lg border px-2 py-1 text-xs font-medium ${showPreview ? 'border-[#718064] bg-[#e5eee1] text-[#31543f]' : 'border-slate-200 bg-white text-slate-700'}`}>{showPreview ? 'Edit' : 'Preview'}</button>
        <button type="button" onClick={onSave} className="ml-auto rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">Save</button>
      </div>

      {showPreview ? <div className="min-h-[18rem] bg-white px-4 py-3"><MarkdownPreview content={localValue || 'Nothing to preview yet.'} /></div> : <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          rows={16}
          placeholder={placeholder}
          className="w-full resize-y border-0 bg-white px-4 py-3 font-mono text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400"
          style={{ minHeight: '18rem' }}
        />}

      <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
        <button type="button" onClick={onExplain} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">Explain</button>
        <button type="button" onClick={onImprove} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white">Improve</button>
        <button type="button" onClick={onDocs} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white">Docs</button>
      </div>
    </div>
  )
}
