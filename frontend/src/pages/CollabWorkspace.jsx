import { useEffect, useMemo, useState } from 'react'
import MarkdownEditor from '../components/MarkdownEditor'
import MarkdownPreview from '../components/MarkdownPreview'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005'

async function apiRequest(endpoint, options = {}, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const errorData = await response.json()
      message = errorData.message || errorData.error || message
    } catch (error) {
      try {
        message = await response.text()
      } catch (textError) {
        console.error(textError)
      }
    }
    throw new Error(message)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function getFileUrl(url) {
  return url?.startsWith('http') ? url : `${API_BASE}${url || ''}`
}

function FilePreview({ file }) {
  const url = getFileUrl(file.url)
  if (file.mimeType?.startsWith('image/')) return <img src={url} alt={file.originalName} className="mt-2 max-h-48 w-full rounded-lg object-contain bg-slate-100" />
  if (file.mimeType?.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType === 'application/javascript') {
    return <iframe title={`Preview of ${file.originalName}`} src={url} className="mt-2 h-40 w-full rounded-lg border border-slate-200 bg-white" />
  }
  return null
}

export default function CollabWorkspace() {
  const { getToken, user } = useAuth()
  const token = getToken()

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [project, setProject] = useState(null)
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [notes, setNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [aiOutput, setAiOutput] = useState('')
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const activeNote = useMemo(
    () => notes.find((note) => note._id === selectedNoteId) || null,
    [notes, selectedNoteId]
  )

  const loadProjects = async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await apiRequest('/api/projects', { method: 'GET' }, token)
      setProjects(data || [])
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0]._id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProject = async (projectId) => {
    if (!projectId || !token) return
    try {
      setLoading(true)
      const projectData = await apiRequest(`/api/projects/${projectId}`, { method: 'GET' }, token)
      setProject(projectData)
      setProjectForm({ name: projectData.name || '', description: projectData.description || '' })
      setIsEditingProject(false)
      setNotes(projectData.notes || [])
      const firstNote = (projectData.notes || [])[0]
      if (firstNote) {
        setSelectedNoteId(firstNote._id)
        setNoteForm({ title: firstNote.title || '', content: firstNote.content || '' })
      } else {
        setSelectedNoteId('')
        setNoteForm({ title: '', content: '' })
      }

      const contributionData = await apiRequest(`/api/analytics/contributions/project/${projectId}`, { method: 'GET' }, token)
      setAnalytics(contributionData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setError('Please log in to access the collaboration workspace.')
      return
    }
    loadProjects()
  }, [token])

  useEffect(() => {
    if (selectedProjectId) {
      loadProject(selectedProjectId)
    }
  }, [selectedProjectId])

  const handleCreateProject = async (event) => {
    event.preventDefault()
    if (!newProject.name.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setLoading(true)
      const data = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description
        })
      }, token)

      setProjects((prev) => [data, ...prev])
      setSelectedProjectId(data._id)
      setNewProject({ name: '', description: '' })
      setSuccess('Project created successfully')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (event) => {
    event.preventDefault()
    if (!selectedProjectId || !newMemberEmail.trim()) return

    try {
      setLoading(true)
      const data = await apiRequest(`/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: newMemberEmail, role: 'member' })
      }, token)
      setProject(data)
      setNewMemberEmail('')
      setSuccess('Member added to project')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProject = async (event) => {
    event.preventDefault()
    if (!selectedProjectId || !projectForm.name.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setLoading(true)
      const updatedProject = await apiRequest(`/api/projects/${selectedProjectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: projectForm.name,
          description: projectForm.description
        })
      }, token)

      setProject(updatedProject)
      setProjects((prev) => prev.map((item) => item._id === updatedProject._id ? { ...item, ...updatedProject } : item))
      setIsEditingProject(false)
      setSuccess('Project updated successfully')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProjectId || !window.confirm('Delete this project and all its data?')) return

    try {
      setLoading(true)
      await apiRequest(`/api/projects/${selectedProjectId}`, { method: 'DELETE' }, token)
      const remainingProjects = projects.filter((item) => item._id !== selectedProjectId)
      setProjects(remainingProjects)
      setSelectedProjectId(remainingProjects[0]?._id || '')
      setProject(null)
      setSuccess('Project deleted successfully')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberUserId) => {
    if (!selectedProjectId || !memberUserId || !window.confirm('Remove this member from the project?')) return

    try {
      setLoading(true)
      await apiRequest(`/api/projects/${selectedProjectId}/members/${memberUserId}`, { method: 'DELETE' }, token)
      await loadProject(selectedProjectId)
      setSuccess('Member removed from project')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedProjectId || !noteForm.content.trim()) {
      setError('Note content is required before saving.')
      return
    }

    try {
      setLoading(true)
      let result

      if (selectedNoteId) {
        result = await apiRequest(`/api/notes/${selectedNoteId}`, {
          method: 'PUT',
          body: JSON.stringify({ title: noteForm.title, content: noteForm.content })
        }, token)
      } else {
        result = await apiRequest('/api/notes', {
          method: 'POST',
          body: JSON.stringify({
            project: selectedProjectId,
            title: noteForm.title,
            content: noteForm.content
          })
        }, token)
        setSelectedNoteId(result._id)
      }

      setSuccess('Note saved successfully')
      setError('')
      await loadProject(selectedProjectId)
      if (result && result._id) {
        setSelectedNoteId(result._id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAiRequest = async (type, sourceContent = noteForm.content) => {
    if (!sourceContent.trim()) {
      setError('Please write some note content before using AI.')
      return
    }

    try {
      setLoading(true)
      const endpoint = type === 'explain' ? '/api/gemini/explain' : type === 'improve' ? '/api/gemini/improve' : '/api/gemini/docs'
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ text: sourceContent })
      }, token)

      setAiOutput(data.explanation || data.improved || data.docs || data.readme || 'No response received')
      setSuccess('AI response generated successfully')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExplainFile = async (file) => {
    try {
      setLoading(true)
      const response = await fetch(getFileUrl(file.url))
      if (!response.ok) throw new Error('Unable to read this file for AI analysis')
      const content = await response.text()
      await handleAiRequest('explain', content)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedProjectId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', selectedProjectId)

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/files`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Upload failed (${response.status})`)
      }
      event.target.value = ''
      await loadProject(selectedProjectId)
      setSuccess('File uploaded successfully')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleShareToggle = async () => {
    if (!selectedProjectId || !project) return

    try {
      setLoading(true)
      const data = await apiRequest(`/api/projects/${selectedProjectId}/public-share`, {
        method: 'POST',
        body: JSON.stringify({ enable: !project.publicShareEnabled })
      }, token)
      setProject((prev) => ({ ...prev, publicShareEnabled: data.publicShareEnabled, publicShareToken: data.publicShareToken }))
      setSuccess(data.publicShareEnabled ? 'Public share enabled' : 'Public share disabled')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    try {
      setLoading(true)
      await apiRequest(`/api/notes/${noteId}`, { method: 'DELETE' }, token)
      setSuccess('Note deleted')
      await loadProject(selectedProjectId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return
    try {
      setLoading(true)
      await apiRequest(`/api/files/${fileId}`, { method: 'DELETE' }, token)
      setSuccess('File deleted')
      await loadProject(selectedProjectId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const projectLink = project?.publicShareEnabled && project?.publicShareToken
    ? `${window.location.origin}/public/${project.publicShareToken}`
    : ''

  const memberSummary = analytics.map((entry) => {
    const user = project?.members?.find((member) => member.user?._id === entry._id || member.user === entry._id)
    const memberName = user?.user?.name || user?.name || 'Unknown member'
    return {
      ...entry,
      name: memberName,
      total: entry.total || 0
    }
  })

  return (
    <div className="space-y-6">
      <div className="app-page-header">
        <div>
          <p className="app-eyebrow">COLLABSPHERE / PROJECTS</p>
          <h1 className="app-display-heading text-4xl text-slate-900">Workspace & Collaboration</h1>
        </div>
        <div className="app-date-chip">Notes, files, people</div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid lg:grid-cols-[260px_1fr_320px] gap-6">
        <aside className="app-surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-4">Projects</h2>
          <form onSubmit={handleCreateProject} className="mb-5 space-y-3">
            <input
              value={newProject.name}
              onChange={(event) => setNewProject((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="New project name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <textarea
              value={newProject.description}
              onChange={(event) => setNewProject((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Project description"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button type="submit" className="app-primary w-full rounded-xl px-3 py-2 text-sm font-medium">
              Create project
            </button>
          </form>

          <div className="space-y-2">
            {projects.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setSelectedProjectId(item._id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  selectedProjectId === item._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-semibold text-slate-800">{item.name}</div>
                <div className="text-xs text-slate-500">{(item.members || []).length} members</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="app-surface rounded-2xl p-5">
          {project ? (
            <>
              <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
                {isEditingProject ? (
                  <form onSubmit={handleUpdateProject} className="w-full space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                      <div className="space-y-3">
                        <input
                          value={projectForm.name}
                          onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Project name"
                        />
                        <textarea
                          value={projectForm.description}
                          onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Project description"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2 md:flex-col">
                        <button type="submit" className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save</button>
                        <button type="button" onClick={() => setIsEditingProject(false)} className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
                    <p className="text-sm text-slate-600">{project.description || 'No description yet'}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {!isEditingProject && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProject(true)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Edit project
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                  >
                    Delete project
                  </button>
                  <button
                    type="button"
                    onClick={handleShareToggle}
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${
                      project.publicShareEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {project.publicShareEnabled ? 'Disable public link' : 'Enable public link'}
                  </button>
                </div>
              </div>

              {projectLink && (
                <div className="mt-4 rounded-xl border border-[#cfdcc7] bg-[#eef4e9] p-3 text-sm text-[#31543f]">
                  Public view: <a href={projectLink} className="font-semibold underline" target="_blank" rel="noreferrer">{projectLink}</a>
                </div>
              )}

              <div className="grid gap-6 mt-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Markdown notes</h3>
                  </div>

                  <div className="space-y-3">
                    <input
                      value={noteForm.title}
                      onChange={(event) => setNoteForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Note title"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />

                    <MarkdownEditor
                      value={noteForm.content}
                      onChange={(content) => setNoteForm((prev) => ({ ...prev, content }))}
                      onSave={handleSaveNote}
                      onExplain={() => handleAiRequest('explain')}
                      onImprove={() => handleAiRequest('improve')}
                      onDocs={() => handleAiRequest('docs')}
                    />
                  </div>

                  {aiOutput && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="mb-2 font-semibold text-slate-800">AI output</h4>
                      <MarkdownPreview content={aiOutput} />
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold">Project members</h3>
                    <form onSubmit={handleAddMember} className="space-y-3">
                      <input
                        value={newMemberEmail}
                        onChange={(event) => setNewMemberEmail(event.target.value)}
                        placeholder="Add member by email"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button type="submit" className="app-primary w-full rounded-xl px-3 py-2 text-sm font-medium">
                        Add member
                      </button>
                    </form>

                    <div className="mt-4 space-y-2">
                      {(project.members || []).map((member) => {
                        const memberUserId = member.user?._id || member.user
                        const isOwner = project.owner && (typeof project.owner === 'string' ? project.owner : project.owner._id) === user?._id
                        const isCurrentMember = memberUserId === user?._id
                        const canRemove = isOwner && !isCurrentMember

                        return (
                          <div key={memberUserId} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="font-medium">{member.user?.name || 'User'}</div>
                                <div className="text-xs text-slate-500">{member.user?.email || 'No email'} · {member.role}</div>
                              </div>
                              {canRemove && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(memberUserId)}
                                  className="text-xs font-semibold text-red-600 underline"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold">Files</h3>
                    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-sm font-medium text-slate-700">
                      Upload file
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>

                    <div className="mt-4 space-y-2">
                      {(project.files || []).map((file) => (
                        <div key={file._id} className="rounded-xl bg-white px-3 py-2 text-sm border border-slate-200">
                          <div className="flex items-center justify-between gap-2"><div className="font-medium text-slate-800">{file.originalName}</div><button type="button" onClick={() => handleDeleteFile(file._id)} className="text-xs font-semibold text-red-600 underline">Delete</button></div>
                          <div className="text-xs text-slate-500">{file.mimeType || 'unknown'} · {(file.size / 1024).toFixed(1)} KB</div>
                          <FilePreview file={file} />
                          {(file.mimeType?.startsWith('text/') || file.mimeType === 'application/javascript' || /\.(js|jsx|ts|tsx|py|java|rb|go|php|css|html|json)$/i.test(file.originalName)) && (
                            <button type="button" onClick={() => handleExplainFile(file)} className="mt-2 mr-3 text-xs font-medium text-violet-700 underline">
                              Explain code with AI
                            </button>
                          )}
                          <a href={getFileUrl(file.url)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-600 underline">
                            Open file
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
              Select a project to view notes, files, members, and collaboration analytics.
            </div>
          )}
        </main>

        <aside className="app-surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-4">Contribution insights</h2>
          <div className="space-y-3">
            {memberSummary.length === 0 ? (
              <div className="text-sm text-slate-500">No contribution data yet.</div>
            ) : (
              memberSummary.map((entry) => (
                <div key={entry._id || entry.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{entry.name}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{entry.total}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    {entry.events?.map((event) => (
                      <div key={`${entry._id}-${event.type}`} className="flex items-center justify-between py-1">
                        <span>{event.type}</span>
                        <span>{event.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {notes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Saved notes</h3>
              <div className="space-y-2">
                {notes.map((note) => (
                  <button
                    key={note._id}
                    type="button"
                    onClick={() => {
                      setSelectedNoteId(note._id)
                      setNoteForm({ title: note.title || '', content: note.content || '' })
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      selectedNoteId === note._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2"><div className="font-medium text-slate-800">{note.title || 'Untitled note'}</div><button type="button" onClick={() => handleDeleteNote(note._id)} className="text-xs font-semibold text-red-600 underline">Delete</button></div>
                    <div className="text-xs text-slate-500">{(note.content || '').slice(0, 50)}...</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
