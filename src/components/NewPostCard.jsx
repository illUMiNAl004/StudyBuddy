import { useState } from 'react'

export default function NewPostCard({ onCreatePost = () => {} }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [group, setGroup] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handlePost = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await onCreatePost({
        title: title.trim(),
        description: description.trim(),
        group_name: group.trim(),
        is_private: isPrivate,
      })
      setTitle('')
      setDescription('')
      setGroup('')
      setIsPrivate(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="new-post-card">
      <div className="new-post-top">
        <div className="mini-avatar">?</div>
        <input
          className="post-input"
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <textarea
        className="post-body"
        placeholder="Looking to study? Start a post…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="new-post-meta">
        <input
          className="post-input"
          type="text"
          placeholder="Course/group"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private
        </label>
      </div>
      <div className="post-actions">
        <button
          className="btn-post"
          disabled={isSaving || !title.trim()}
          onClick={handlePost}
        >
          {isSaving ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
