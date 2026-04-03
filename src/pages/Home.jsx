import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewPostCard from "../components/NewPostCard";
import PostCard from "../components/PostCard";
import supabase from "../../Supabase_Config/supabaseClient";

const POSTS = [
  {
    id: 1,
    initial: "?",
    name: "Student Name",
    course: "Course Name",
    time: "Time ago",
    avatarBg: "#e8f0eb",
    avatarColor: "#5a8a62",
    tagStyle: {},
    body: "Post body goes here.",
    helpfulText: "Helpful · 0",
    commentText: "Comment · 0",
    actionLabel: "Action →",
    actionStyle: "join",
  }, //this can be used to add more posts into here
];

export default function Home() {
  const [posts, setPosts] = useState(POSTS);

  function handlePost(body, course) {
    const newPost = {
      id: Date.now(),
      initial: "Y",
      name: "You",
      course,
      time: "Just now",
      avatarBg: "#dbefff",
      avatarColor: "#1a5bbc",
      tagStyle: {},
      body,
      helpfulText: "Helpful · 0",
      commentText: "Comment · 0",
      actionLabel: "Action →",
      actionStyle: "join",
    };

    setPosts((prevPosts) => [newPost, ...prevPosts]);
  }

  return (
    <div className="page">
      <div className="auth-header" style={{ marginBottom: '24px', justifyContent: 'center' }}>
        <div style={{ background: 'var(--surface)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
           <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)' }}>Welcome to StudyBuddy! Ready to sync your studies?</span>
           <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn-auth">Log In</Link>
              <Link to="/register" className="btn-auth primary">Register</Link>
           </div>
        </div>
      </div>
      <div className="layout">
        <Sidebar />
        <main className="feed">
          <NewPostCard onPost={handlePost} />
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              animationDelay={`${(i + 1) * 0.05}s`}
            />
          ))}
        </main>
      </div>
    </div>
  );
}
