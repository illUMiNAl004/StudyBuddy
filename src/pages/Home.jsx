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
      <div style={{
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: '14px', 
        padding: '16px 24px', 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <div>
           <h3 style={{fontSize: '1rem', marginBottom: '4px'}}>Join StudyBuddy</h3>
           <p style={{fontSize: '0.85rem', color: 'var(--muted)'}}>Sign in or create an account to start sharing notes</p>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
           <Link to="/login" className="btn-auth">Log In</Link>
           <Link to="/register" className="btn-auth primary">Create Account</Link>
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
