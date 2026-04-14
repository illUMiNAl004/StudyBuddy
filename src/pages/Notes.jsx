import { useState, useEffect, useRef } from 'react';
import supabase from '../../Supabase_Config/supabaseClient';
import { useAuth } from '../context/AuthContext';

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

export default function Notes() {
  const { user } = useAuth();
  
  // -- Interface State --
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // -- Full Screen Viewer State --
  const [viewerState, setViewerState] = useState(null); 
  
  // -- Upload Modal Engine State Arrays --
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  
  // We explicitly transition from null to an Array!
  const [uploadFiles, setUploadFiles] = useState([]); 
  
  const [uploading, setUploading] = useState(false);
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const fileInputRef = useRef();

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    // Note: Temporary '*' select bypasses the PostgREST relation error for instantaneous feedback!
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data || []);
    }
  }

  // Heavy duty promise-wrapping submission block to upload N files at once securely.
  async function handleModalSubmit(e) {
    e.preventDefault();
    if (uploadFiles.length === 0) {
        setUploadErrorMsg("Please select at least one image file to upload.");
        return;
    }
    if (!uploadTitle.trim()) {
        setUploadErrorMsg("Please provide a title so students know what they are looking at!");
        return;
    }
    
    setUploadErrorMsg('');
    setUploading(true);

    try {
      // 1. Guardrail Block: Guarantee user has a major assigned
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('major')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profileData?.major) {
        throw new Error("Whoops! You must select a valid Major in your Profile before uploading a Note.");
      }

      // 2. Storage Upload Array Loop: We loop over the dynamic size of your selection
      const uploadedUrls = [];
      for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}_${Math.random()}_pg${i+1}.${fileExt}`;
          const filePath = `user_uploads/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('notes')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('notes')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
      }

      // 4. Registry Block: Stamp the Array natively!
      const { error: dbError } = await supabase
        .from('notes')
        .insert([{
          author_id: user.id,
          picture_urls: uploadedUrls, // Using the new TEXT[] architecture!
          major: profileData.major,
          title: uploadTitle.trim(),
          description: uploadDescription.trim() || null
        }]);

      if (dbError) throw dbError;

      // 5. Mission Accomplished: Wiping out the cache
      handleCancelUpload();
      await fetchNotes();

    } catch (err) {
      setUploadErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  }

  // Wipes the deeply nested Array cache
  function handleCancelUpload() {
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadFiles([]);
      setUploadErrorMsg('');
      if (fileInputRef.current) fileInputRef.current.value = null;
  }

  // Database deletion block
  async function confirmDelete(id) {
    setDeletingId(id);
    const { error } = await supabase.from('notes').delete().eq('id', id);
    
    if (error) {
      console.error(error);
      alert("Failed to delete note.");
    } else {
      setNotes(notes.filter(n => n.id !== id));
      setNoteToDelete(null);
    }
    setDeletingId(null);
  }

  const filteredNotes = notes.filter(note => {
    if (activeTab === 'my' && note.author_id !== user?.id) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const majorMatch = note.major?.toLowerCase().includes(query);
      const titleMatch = note.title?.toLowerCase().includes(query); 
      if (!majorMatch && !titleMatch) return false;
    }
    
    return true;
  });

  return (
    <div className="page" style={{ maxWidth: '1200px' }}>
      
      {/* --------------------------- */}
      {/* Header & Controls Container */}
      {/* --------------------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Study Notes</h1>
          <p style={{ color: 'var(--muted)' }}>Share visual study materials based strictly on your preset major.</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search titles, authors..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface)', width: '250px' }}
          />

          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '20px', padding: '4px', border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'all' ? '#fff' : 'var(--text)',
                border: 'none', borderRadius: '16px', padding: '6px 16px', cursor: 'pointer', fontWeight: 600, transition: '0.2s'
              }}
            >
              All Notes
            </button>
            <button 
              onClick={() => setActiveTab('my')}
              style={{
                background: activeTab === 'my' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'my' ? '#fff' : 'var(--text)',
                border: 'none', borderRadius: '16px', padding: '6px 16px', cursor: 'pointer', fontWeight: 600, transition: '0.2s'
              }}
            >
              My Notes
            </button>
          </div>

          <button 
            className="btn-auth primary" 
            onClick={() => setIsUploadModalOpen(true)}
            disabled={uploading}
            style={{ whiteSpace: 'nowrap' }}
          >
            + Upload Note
          </button>
        </div>
      </div>

      {/* --------------------------- */}
      {/* 3-Column Masonry Image Grid */}
      {/* --------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {filteredNotes.map((note) => (
          <div 
            key={note.id} 
            style={{ 
              background: 'var(--surface)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-6px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* The brand new Horizontal Scrolling Swipe Carousel natively powered by CSS Snapping */}
            <div style={{ position: 'relative' }}>
              <div 
                  className="hide-scroll"
                  style={{ height: '220px', width: '100%', background: '#eee', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
              >
                  {note.picture_urls?.map((url, i) => (
                      <div key={i} style={{ flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
                          <img 
                            src={url} 
                            alt={`${note.title || "Study Note"} - Page ${i + 1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onClick={() => setViewerState({ urls: note.picture_urls, index: i })} 
                          />
                      </div>
                  ))}
              </div>
              
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', pointerEvents: 'none' }}>
                {note.major}
              </div>

              {note.picture_urls?.length > 1 && (
                  <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none' }}>
                     {note.picture_urls.length} Pages • Swipe 
                  </div>
              )}
            </div>
            
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
                {note.title || 'Untitled Note'}
              </h3>
              
              {note.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.description}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>
                  Anonymous student
                </span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {note.author_id === user?.id && (
                     <button
                       onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }}
                       style={{ background: 'transparent', border: 'none', color: '#e53935', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
                       onMouseOver={(e) => e.target.style.opacity = '0.7'}
                       onMouseOut={(e) => e.target.style.opacity = '1'}
                     >
                        Delete
                     </button>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {timeAgo(note.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: 'var(--muted)', background: 'var(--surface)', borderRadius: '20px' }}>
            Nothing natively matches your search. Be the first to add a note!
          </div>
        )}
      </div>

      {/* --------------------------- */}
      {/* Premium Deletion Confirmation Modal */}
      {/* --------------------------- */}
      {noteToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center', animation: 'fadeUp 0.2s ease both' }}>
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'Instrument Serif, serif', marginBottom: '12px' }}>Delete Note?</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Are you sure you want to permanently delete this note? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setNoteToDelete(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDelete(noteToDelete)}
                disabled={deletingId === noteToDelete}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: '#d32f2f', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                {deletingId === noteToDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------- */}
      {/* Premium Upload Modal Form!! */}
      {/* --------------------------- */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'fadeUp 0.3s ease both' }}>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'Instrument Serif, serif' }}>Create New Note</h2>
            
            {uploadErrorMsg && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#ffebee', color: '#d32f2f', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                {uploadErrorMsg}
              </div>
            )}

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Chapter 4: Photosynthesis" 
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', font: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description (Optional)</label>
                <textarea 
                  placeholder="Provide context or key takeaways..." 
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  rows="3"
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', font: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Attach Images *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple // Now supports highlighting 20 images at once!
                  onChange={e => setUploadFiles(Array.from(e.target.files))}
                  style={{ padding: '8px 0' }}
                />
                {uploadFiles.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                       {uploadFiles.length} file(s) selected automatically
                    </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={handleCancelUpload}
                  disabled={uploading}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  {uploading ? 'Processing...' : 'Publish Note'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --------------------------- */}
      {/* Cinematic Image Viewer Modal*/}
      {/* --------------------------- */}
      {viewerState && (
        <div 
          onClick={() => setViewerState(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}
        >
          {viewerState.urls.length > 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setViewerState(prev => ({ ...prev, index: prev.index > 0 ? prev.index - 1 : prev.urls.length - 1 }));
              }}
              style={{ position: 'absolute', left: '30px', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.5)', width: '50px', height: '50px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10000, transition: '0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              onMouseOver={(e) => e.target.style.borderColor = '#fff'}
              onMouseOut={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
            >
              ←
            </button>
          )}

          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img 
              src={viewerState.urls[viewerState.index]} 
              style={{ maxWidth: '100vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
              onClick={(e) => e.stopPropagation()} 
            />
            {viewerState.urls.length > 1 && (
               <div style={{ position: 'absolute', bottom: '-40px', color: '#fff', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                  {viewerState.index + 1} / {viewerState.urls.length}
               </div>
            )}
          </div>

          {viewerState.urls.length > 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setViewerState(prev => ({ ...prev, index: prev.index < prev.urls.length - 1 ? prev.index + 1 : 0 }));
              }}
              style={{ position: 'absolute', right: '30px', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.5)', width: '50px', height: '50px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10000, transition: '0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              onMouseOver={(e) => e.target.style.borderColor = '#fff'}
              onMouseOut={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
            >
              →
            </button>
          )}

          <button 
            onClick={() => setViewerState(null)}
            style={{ position: 'absolute', top: '30px', right: '30px', background: 'transparent', color: '#fff', border: 'none', fontSize: '1.8rem', cursor: 'pointer', zIndex: 10000 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
