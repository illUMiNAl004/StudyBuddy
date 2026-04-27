import { useState, useEffect } from "react";
import supabase from "../../Supabase_Config/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function NewPostCard({ onPost, isAuthenticated, onAuthRequired }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [courseInput, setCourseInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [error, setError] = useState("");
  const [userGroups, setUserGroups] = useState([]);

  // Group toggle state
  const [createNewGroup, setCreateNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);

  // Meeting schedule state
  const [meetingDays, setMeetingDays] = useState([]);
  const [meetingTime, setMeetingTime] = useState("");

  const daysOfWeek = [
    { key: "Mon", label: "M" },
    { key: "Tue", label: "T" },
    { key: "Wed", label: "W" },
    { key: "Thu", label: "Th" },
    { key: "Fri", label: "F" },
    { key: "Sat", label: "S" },
    { key: "Sun", label: "S" }
  ];

  useEffect(() => {
    if (!user) return;
    async function fetchUserGroups() {
      const { data, error } = await supabase
        .from('user_in_group')
        .select('group_id, groups(id, group_title)')
        .eq('user_id', user.id);
      if (!error && data) {
        setUserGroups(data.map(row => ({ id: row.groups.id, name: row.groups.group_title })));
      }
    }
    fetchUserGroups();
  }, [user]);

  function reset() {
    setExpanded(false);
    setCourseInput("");
    setPostInput("");
    setError("");
    setCreateNewGroup(false);
    setNewGroupName("");
    setSelectedGroupId("");
    setIsPrivateGroup(false);
    setMeetingDays([]);
    setMeetingTime("");
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
    onPost?.(body, course, {
      createNewGroup,
      newGroupName: newGroupName.trim(),
      selectedGroupId,
      isPrivateGroup,
      meetingDays,
      meetingTime,
    });
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

              {/* Conditional: New Group Name Input + privacy */}
              {createNewGroup && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
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

                  {/* Public / Private toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary, #666)", fontWeight: 500, userSelect: "none" }}>
                      {isPrivateGroup ? "Private — approval required" : "Public — anyone can join"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPrivateGroup((v) => !v)}
                      aria-pressed={isPrivateGroup}
                      title="Toggle group privacy"
                      style={{
                        position: "relative",
                        width: "40px",
                        height: "22px",
                        borderRadius: "11px",
                        border: "none",
                        cursor: "pointer",
                        background: isPrivateGroup ? "#e07b3a" : "var(--accent, #5a8a62)",
                        transition: "background 0.2s ease",
                        flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute",
                        top: "3px",
                        left: isPrivateGroup ? "21px" : "3px",
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

                  {/* Meeting Schedule Section */}
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={{ fontSize: "0.82rem", color: "var(--text-secondary, #666)", fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                      Meeting Schedule (Optional)
                    </label>

                    {/* Days of Week Selection */}
                    <div style={{ marginBottom: "0.6rem" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary, #888)", margin: "0 0 0.4rem 0" }}>Days</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {daysOfWeek.map((day) => (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => {
                              setMeetingDays((prev) =>
                                prev.includes(day.key)
                                  ? prev.filter((d) => d !== day.key)
                                  : [...prev, day.key]
                              );
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: meetingDays.includes(day.key)
                                ? "2px solid var(--accent, #5a8a62)"
                                : "1.5px solid var(--border, #dde3df)",
                              background: meetingDays.includes(day.key)
                                ? "var(--accent, #5a8a62)"
                                : "transparent",
                              color: meetingDays.includes(day.key)
                                ? "#fff"
                                : "var(--text, #1a1a1a)",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary, #888)", margin: "0 0 0.4rem 0" }}>Time</p>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1.5px solid var(--border, #dde3df)",
                          fontSize: "0.9rem",
                          outline: "none",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--accent, #5a8a62)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border, #dde3df)")}
                      />
                    </div>
                  </div>
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
                      {userGroups.map((g) => (
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