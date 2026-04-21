import { useState } from "react";

// Mock: replace with real data from your auth/groups context
const USER_GROUPS = [
  { id: "1", name: "CS Study Squad" },
  { id: "2", name: "Bio Lab Partners" },
  { id: "3", name: "Calc Study Group" },
  { id: "4", name: "Econ Discussion" },
];

export default function NewPostCard({ onPost, isAuthenticated, onAuthRequired }) {
  const [expanded, setExpanded] = useState(false);
  const [courseInput, setCourseInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [error, setError] = useState("");

  // Group toggle state
  const [createNewGroup, setCreateNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  function reset() {
    setExpanded(false);
    setCourseInput("");
    setPostInput("");
    setError("");
    setCreateNewGroup(false);
    setNewGroupName("");
    setSelectedGroupId("");
  }

  function submit() {
    const course = courseInput.trim();
    const body = postInput.trim();

    if (!course && !body) {
      setError("Add a course name and post content");
      return;
    }
    if (!course) {
      setError("Add a course name");
      return;
    }
    if (!body) {
      setError("Add post content");
      return;
    }
    if (createNewGroup && !newGroupName.trim()) {
      setError("Add a group name");
      return;
    }
    if (!createNewGroup && !selectedGroupId) {
      setError("Select a group");
      return;
    }

    setError("");
    onPost?.(body, course);
    reset();
  }

  return (
    <>
      <div className="new-post-card">
        <div
          className="new-post-top"
          onClick={() => {
            if (!isAuthenticated) {
              onAuthRequired?.();
              return;
            }
            setExpanded(true);
          }}
          style={{ cursor: "text" }}
        >
          <div className="mini-avatar">?</div>
          <input
            className="post-input"
            type="text"
            placeholder="What do you want to talk about?"
            readOnly
          />
        </div>
      </div>

      {expanded && (
        <div className="new-post-modal" onClick={reset}>
          <div
            className="new-post-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="new-post-modal-header">
              <span>Create post</span>
              <button className="close-btn" onClick={reset}>
                &times;
              </button>
            </div>

            <div className="new-post-field">
              <label htmlFor="courseInput">Course (subject)</label>
              <input
                id="courseInput"
                type="text"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                placeholder="Add course name..."
              />
            </div>

            <div className="new-post-field">
              <label htmlFor="postInput">Post content</label>
              <textarea
                id="postInput"
                value={postInput}
                onChange={(e) => setPostInput(e.target.value)}
                placeholder="What do you want to study?"
                rows={6}
              />
            </div>

            {/* Group Section */}
            <div style={{ marginTop: "0.75rem" }}>
              {/* Toggle Row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "0.6rem"
              }}>
                <span style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary, #666)",
                  fontWeight: 500,
                  userSelect: "none"
                }}>
                  Create new group?
                </span>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => {
                    setCreateNewGroup((v) => !v);
                    setNewGroupName("");
                    setSelectedGroupId("");
                    setError("");
                  }}
                  aria-pressed={createNewGroup}
                  style={{
                    position: "relative",
                    width: "40px",
                    height: "22px",
                    borderRadius: "11px",
                    border: "none",
                    cursor: "pointer",
                    background: createNewGroup ? "var(--accent, #5a8a62)" : "#ccc",
                    transition: "background 0.2s ease",
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <span style={{
                    position: "absolute",
                    top: "3px",
                    left: createNewGroup ? "21px" : "3px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s ease",
                    display: "block",
                  }} />
                </button>
              </div>

              {/* Conditional: New Group Name Input */}
              {createNewGroup && (
                <div className="new-post-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="newGroupName">Group name</label>
                  <input
                    id="newGroupName"
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Add group name..."
                    autoFocus
                  />
                </div>
              )}

              {/* Conditional: Select Existing Group Dropdown */}
              {!createNewGroup && (
                <div className="new-post-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="groupSelect">Group</label>
                  <div style={{ position: "relative" }}>
                    <select
                      id="groupSelect"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 36px 10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid var(--border, #dde3df)",
                        background: "var(--surface, #fff)",
                        color: selectedGroupId ? "var(--text, #1a1a1a)" : "var(--text-secondary, #999)",
                        fontSize: "0.95rem",
                        appearance: "none",
                        WebkitAppearance: "none",
                        cursor: "pointer",
                        outline: "none",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--accent, #5a8a62)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border, #dde3df)"}
                    >
                      <option value="" disabled>Select a group...</option>
                      {USER_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {/* Chevron icon */}
                    <span style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "var(--text-secondary, #888)",
                      fontSize: "0.75rem",
                    }}>
                      ▾
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p style={{ color: '#c44', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{error}</p>
            )}

            <div className="post-actions" style={{ marginTop: "0.75rem" }}>
              <button className="btn-post" type="button" onClick={submit}>
                Post
              </button>
              <button className="post-action-btn" type="button" onClick={reset}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}