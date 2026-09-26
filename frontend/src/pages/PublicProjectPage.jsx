import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MarkdownPreview from '../components/MarkdownPreview'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005'

function getFileUrl(url) {
  return url?.startsWith('http') ? url : `${API_BASE}${url || ''}`
}

export default function PublicProjectPage() {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPublicProject = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/projects/public/${token}`)
        if (!response.ok) {
          throw new Error('This project is not public or the link is invalid.')
        }
        const result = await response.json()
        setProject(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadPublicProject()
    }
  }, [token])

  if (loading) {
    return <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-slate-500 shadow-sm">Loading public project...</div>
  }

  if (error) {
    return <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">{error}</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-600 font-semibold">Public project</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{project?.name}</h1>
        <p className="mt-3 text-slate-600">{project?.description || 'No description provided.'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Notes</h2>
          {(project?.notes || []).length === 0 ? (
            <p className="text-slate-500">No public notes available.</p>
          ) : (
            <div className="space-y-4">
              {(project.notes || []).map((note) => (
                <article key={note._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-800">{note.title || 'Untitled note'}</h3>
                  <MarkdownPreview content={note.content || 'No content.'} />
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Files</h2>
          {(project?.files || []).length === 0 ? (
            <p className="text-slate-500">No public files available.</p>
          ) : (
            <div className="space-y-3">
              {(project.files || []).map((file) => (
                <div key={file._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">{file.originalName}</div>
                  {file.mimeType?.startsWith('image/') && <img src={getFileUrl(file.url)} alt={file.originalName} className="mt-2 max-h-48 w-full rounded-lg object-contain bg-slate-100" />}
                  <a href={getFileUrl(file.url)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-600 underline">
                    Open file
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
