import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewPostCard from "../components/NewPostCard";
import PostCard from "../components/PostCard";
import AuthPromptModal from "../components/AuthPromptModal";
import supabase from "../../Supabase_Config/supabaseClient";
import { useAuth } from "../context/AuthContext";

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mapRow(row, profileMap, memberGroupIds, pendingGroupIds) {
  var gid = row.group_id || null;
  var groupInfo = row.groups || null;
  var requiresInvite = groupInfo ? groupInfo.requires_invite : false;

  var isMember = false;
  var hasPending = false;

  if (memberGroupIds && gid) {
    isMember = memberGroupIds.has(gid);
  }
  if (pendingGroupIds && gid) {
    hasPending = pendingGroupIds.has(gid);
  }

  var actionLabel = 'Join Group →';
  var actionStyle = 'join';

  if (!gid) {
    actionLabel = 'Action →';
    actionStyle = 'join';
  } else if (isMember) {
    actionLabel = 'Joined ✓';
    actionStyle = 'joined';
  } else if (hasPending) {
    actionLabel = 'Waiting for approval';
    actionStyle = 'pending';
  } else if (requiresInvite) {
    actionLabel = 'Request to Join →';
    actionStyle = 'join';
  } else {
    actionLabel = 'Join Group →';
    actionStyle = 'join';
  }

  var nameVal = 'Student';
  if (profileMap && profileMap[row.user_id]) {
    nameVal = profileMap[row.user_id];
  } else if (row.profiles && row.profiles.full_name) {
    nameVal = row.profiles.full_name;
  }

  return {
    id: row.id,
    userId: row.user_id,
    groupId: gid,
    requiresInvite: requiresInvite,
    isMember: isMember,
    hasPending: hasPending,
    initial: (row.course || row.title)?.[0]?.toUpperCase() || '?',
    name: nameVal,
    course: row.course || row.title || 'General',
    time: timeAgo(row.created_at),
    avatarBg: '#e8f0eb',
    avatarColor: '#5a8a62',
    tagStyle: {},
    body: row.description,
    helpful: row.helpful ?? 0,
    actionLabel: actionLabel,
    actionStyle: actionStyle,
  };
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { user } = useAuth();

  function openAuthPrompt() {
    setAuthPromptOpen(true);
  }

  async function loadAllPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*, groups(id, group_title, requires_invite)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    // pull out unique user ids so we can batch-fetch profile names
    var seenIds = [];
    for (var i = 0; i < data.length; i++) {
      var uid = data[i].user_id;
      if (uid && !seenIds.includes(uid)) {
        seenIds.push(uid);
      }
    }

    var pmap = {};
    if (seenIds.length > 0) {
      var { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', seenIds);
      if (profileRows) {
        for (var j = 0; j < profileRows.length; j++) {
          pmap[profileRows[j].id] = profileRows[j].full_name;
        }
      }
    }

    var memberSet = new Set();
    var pendingSet = new Set();
    var likedSet = new Set();

    if (user) {
      var { data: memberRows } = await supabase
        .from('user_in_group')
        .select('group_id')
        .eq('user_id', user.id);
      if (memberRows) {
        for (var k = 0; k < memberRows.length; k++) {
          memberSet.add(memberRows[k].group_id);
        }
      }

      var { data: reqRows } = await supabase
        .from('group_join_requests')
        .select('group_id')
        .eq('requester_id', user.id)
        .eq('status', 'pending');
      if (reqRows) {
        for (var m = 0; m < reqRows.length; m++) {
          pendingSet.add(reqRows[m].group_id);
        }
      }

      var { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      if (likesData) {
        for (var n = 0; n < likesData.length; n++) {
          likedSet.add(String(likesData[n].post_id));
        }
      }
    }

    var mapped = [];
    for (var p = 0; p < data.length; p++) {
      var row = data[p];
      mapped.push({
        ...mapRow(row, pmap, memberSet, pendingSet),
        likedByUser: likedSet.has(String(row.id)),
      });
    }
    setPosts(mapped);
  }

  useEffect(() => {
    loadAllPosts();
  }, [user]);

  async function handleDelete(postId) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }

  async function handleEdit(postId, updatedBody) {
    const { error } = await supabase
      .from('posts')
      .update({ description: updatedBody })
      .eq('id', postId);

    if (error) {
      console.error('Error updating post:', error);
      return;
    }

    // just swap out the body, keep everything else intact
    setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, body: updatedBody } : post));
  }

  async function handleLike(postId, liked) {
    if (!user) return;

    const postIdStr = String(postId);

    if (liked) {
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({ user_id: user.id, post_id: postIdStr });
      if (likeError) {
        console.error('Error inserting like (did you run 03_post_likes_schema.sql?):', likeError);
        return;
      }
    } else {
      const { error: unlikeError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postIdStr);
      if (unlikeError) {
        console.error('Error deleting like:', unlikeError);
        return;
      }
    }

    const delta = liked ? 1 : -1;
    const currentPost = posts.find((p) => p.id === postId);
    const newCount = (currentPost?.helpful ?? 0) + delta;

    const { error } = await supabase
      .from('posts')
      .update({ helpful: newCount })
      .eq('id', postId);

    if (error) {
      console.error('Error updating helpful count:', error);
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, helpful: newCount, likedByUser: liked } : p
      )
    );
  }

  async function handlePost(body, course, groupOptions = {}) {
    const { createNewGroup, newGroupName, selectedGroupId, isPrivateGroup } = groupOptions;

    var groupId = selectedGroupId || null;
    var groupRequiresInvite = false;

    // if making a brand new group, insert it first
    if (createNewGroup && newGroupName) {
      groupRequiresInvite = isPrivateGroup === true;

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          group_title: newGroupName,
          creator_id: user.id,
          requires_invite: groupRequiresInvite,
        }])
        .select('id')
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        return;
      }

      groupId = groupData.id;

      // make sure the creator is in user_in_group (trigger handles this but belt-and-suspenders)
      const { error: memberError } = await supabase
        .from('user_in_group')
        .upsert([{ user_id: user.id, group_id: groupId }], { onConflict: 'group_id,user_id', ignoreDuplicates: true });
      if (memberError) {
        console.error('Error adding creator to user_in_group:', memberError);
      }
    }

    if (!groupId) {
      console.error('No group id, cannot post');
      return;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([{
        user_id: user.id,
        group_id: groupId,
        course: course,
        description: body,
        is_private: false,
      }])
      .select();

    if (error) {
      console.error('Error creating post:', error);
      return;
    }

    // backfill post_id onto new group
    if (createNewGroup && data?.[0]?.id) {
      await supabase
        .from('groups')
        .update({ post_id: data[0].id })
        .eq('id', groupId);
    }

    // do a full reload so the new post shows up with proper name + group info
    await loadAllPosts();
  }

  async function handleJoinGroup(postId) {
    if (!user) return;

    var post = null;
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === postId) { post = posts[i]; break; }
    }

    if (!post || !post.groupId) return;
    if (post.isMember || post.hasPending) return;

    if (post.requiresInvite) {
      // private group — send a join request
      var { error: reqErr } = await supabase
        .from('group_join_requests')
        .insert([{ group_id: post.groupId, requester_id: user.id }]);
      if (reqErr) {
        console.error('Error sending join request:', reqErr);
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, hasPending: true, actionLabel: 'Waiting for approval', actionStyle: 'pending' }
            : p
        )
      );
    } else {
      // public group — join directly
      var { error: joinErr } = await supabase
        .from('user_in_group')
        .insert([{ user_id: user.id, group_id: post.groupId }]);
      if (joinErr) {
        console.error('Error joining group:', joinErr);
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isMember: true, actionLabel: 'Joined ✓', actionStyle: 'joined' }
            : p
        )
      );
    }
  }

  return (
    <div className="page">
      {!user && (
        <div className="auth-header" style={{ marginBottom: '24px', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
             <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)' }}>Welcome to StudyBuddy! Ready to sync your studies?</span>
             <div style={{ display: 'flex', gap: '12px' }}>
                <Link to="/login" className="btn-auth">Log In</Link>
                <Link to="/register" className="btn-auth primary">Register</Link>
             </div>
          </div>
        </div>
      )}
      <div className="layout">
        <Sidebar />
        <main className="feed">
          <NewPostCard
            onPost={handlePost}
            isAuthenticated={Boolean(user)}
            onAuthRequired={openAuthPrompt}
          />
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              initialLiked={post.likedByUser ?? false}
              isAuthenticated={Boolean(user)}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onLike={handleLike}
              onAction={handleJoinGroup}
              onAuthRequired={openAuthPrompt}
              animationDelay={`${(i + 1) * 0.05}s`}
            />
          ))}
        </main>
      </div>
      <AuthPromptModal open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </div>
  );
}