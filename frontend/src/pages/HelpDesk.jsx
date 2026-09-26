import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import MarkdownPreview from '../components/MarkdownPreview'
import { getApiUrl, handleApiError } from '../utils/apiConfig'

export default function HelpDesk() {
  const { getToken } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', question: '' })
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const generateAnswer = async (event) => {
    event.preventDefault()
    setError('')
    setResponse(null)
    setLoading(true)
    try {
      const result = await fetch(`${getApiUrl()}/api/gemini/helpdesk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form)
      })
      const data = await result.json()
      if (!result.ok) throw new Error(data.message || 'Unable to generate a response')
      setResponse(data)
    } catch (requestError) {
      setError(handleApiError(requestError, 'Help Desk request'))
    } finally {
      setLoading(false)
    }
  }

  const downloadMarkdown = () => {
    if (!response?.markdown) return
    const blob = new Blob([`# ${response.title}\n\n${response.markdown}`], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'help-desk-response'}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <p className="app-eyebrow">SUPPORT / AI WORKBENCH</p>
          <h1 className="app-display-heading text-4xl text-slate-900">Help Desk</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Describe the situation clearly and get a context-specific Markdown response you can keep with your project.</p>
        </div>
        <div className="app-date-chip">Groq-powered guidance</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <form onSubmit={generateAnswer} className="app-surface rounded-2xl p-6">
          <div className="mb-6"><p className="app-eyebrow">YOUR INPUT</p><h2 className="app-display-heading text-2xl text-slate-900">What do you need help with?</h2></div>
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <label className="app-field-label">Title<input required value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="e.g. Cloudinary upload fails" /></label>
          <label className="app-field-label">Description<textarea required value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Explain the context, what you tried, and what you expected..." rows={6} /></label>
          <label className="app-field-label">Question<textarea required value={form.question} onChange={(event) => updateField('question', event.target.value)} placeholder="Ask the exact question you want answered..." rows={5} /></label>
          <button disabled={loading} className="app-primary mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Preparing your response...' : 'Generate Markdown response'}</button>
        </form>

        <section className="app-surface min-h-[34rem] rounded-2xl p-6">
          <div className="mb-6 flex items-start justify-between gap-4"><div><p className="app-eyebrow">AI RESPONSE</p><h2 className="app-display-heading text-2xl text-slate-900">A useful answer, ready to keep</h2></div>{response && <button onClick={downloadMarkdown} className="rounded-full border border-[#b9c9ae] bg-[#eef4e9] px-4 py-2 text-xs font-semibold text-[#31543f] hover:bg-[#dfe8d8]">Download .md</button>}</div>
          {response ? <MarkdownPreview content={response.markdown} /> : <div className="grid min-h-[24rem] place-items-center rounded-xl border border-dashed border-[#cfd8c8] bg-[#f6f3eb] p-8 text-center"><div><div className="mb-3 text-4xl text-[#718064]">✦</div><p className="font-semibold text-slate-700">Your response will appear here</p><p className="mt-2 max-w-sm text-sm text-slate-500">Add a title, context, and one clear question to get specific guidance instead of a generic answer.</p></div></div>}
        </section>
      </div>
    </div>
  )
}
