
import React, { useMemo, useState } from 'react';
import { User, Skill, ContentItem } from '../types';
import { GoogleGenAI } from "@google/genai";

interface UserMatchingProps {
  currentUser: User;
  users: User[];
  skills: Skill[];
  contents: ContentItem[];
  onViewProfile: (userId: string) => void;
  onViewContent: (skillId: string, contentId: string) => void;
  onAddNotification: (notif: any) => void;
  onlineUsers?: User[];
}

const UserMatching: React.FC<UserMatchingProps> = ({ 
  currentUser, 
  users, 
  skills, 
  contents, 
  onViewProfile, 
  onViewContent,
  onAddNotification,
  onlineUsers = []
}) => {
  const [matchInsight, setMatchInsight] = useState<{ userId: string, text: string } | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'can-teach' | 'can-learn'>('all');
  const [activeModal, setActiveModal] = useState<{ type: 'message' | 'schedule', peer: any } | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const allPeers = useMemo(() => {
    const merged = [...users];
    onlineUsers.forEach(ou => {
      if (!merged.some(u => u.id === ou.id)) {
        merged.push(ou);
      }
    });
    return merged;
  }, [users, onlineUsers]);

  const peerMatches = useMemo(() => {
    return allPeers
      .filter(u => u.id !== currentUser.id)
      .map(u => {
        // Find skills I want to learn that they can teach
        const canTeachMe = u.teachingSkills.filter(s => currentUser.learningSkills.includes(s));
        // Find skills I can teach that they want to learn
        const canLearnFromMe = u.learningSkills.filter(s => currentUser.teachingSkills.includes(s));
        
        const matchCount = canTeachMe.length + canLearnFromMe.length;
        
        return {
          ...u,
          canTeachMe,
          canLearnFromMe,
          matchCount,
          isOnline: onlineUsers.some(ou => ou.id === u.id)
        };
      })
      .filter(u => {
        if (filterType === 'can-teach') return u.canTeachMe.length > 0;
        if (filterType === 'can-learn') return u.canLearnFromMe.length > 0;
        return u.matchCount > 0;
      })
      .sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return b.matchCount - a.matchCount;
      });
  }, [currentUser, allPeers, filterType, onlineUsers]);

  const generateMatchInsight = async (peer: any) => {
    if (isGeneratingInsight) return;
    setIsGeneratingInsight(peer.id);
    setMatchInsight(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
      const prompt = `
        As a peer learning matchmaker, suggest how these two users can collaborate.
        User A (Current User): ${currentUser.name}. Learning: ${currentUser.learningSkills.join(', ')}. Teaching: ${currentUser.teachingSkills.join(', ')}.
        User B (Peer): ${peer.name}. Learning: ${peer.learningSkills.join(', ')}. Teaching: ${peer.teachingSkills.join(', ')}.
        
        Provide a concise (2-3 sentences) suggestion for a first conversation or collaborative project that benefits both. Focus on the specific skill overlap.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.7 }
      });

      setMatchInsight({ userId: peer.id, text: response.text || "No suggestion available." });
    } catch (error) {
      console.error("Match insight error:", error);
      setMatchInsight({ userId: peer.id, text: "AI Matchmaker is currently offline. Try again later!" });
    } finally {
      setIsGeneratingInsight(null);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn relative z-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">SKILL MATCHMAKER</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-2">
            AI-powered peer discovery based on your learning goals and expertise.
          </p>
        </div>
        
        <div className="flex bg-white/40 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            All Matches
          </button>
          <button 
            onClick={() => setFilterType('can-teach')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'can-teach' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Can Teach Me
          </button>
          <button 
            onClick={() => setFilterType('can-learn')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'can-learn' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Can Learn From Me
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {peerMatches.map(peer => (
          <div 
            key={peer.id}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white dark:border-white/5 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[5rem] pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
            
            <div className="flex items-start gap-8 mb-8">
              <div className="relative shrink-0">
                <img src={peer.avatar} className="w-28 h-28 rounded-[2.5rem] object-cover border-4 border-white dark:border-slate-700 shadow-2xl" alt={peer.name} />
                {peer.isOnline && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-xs text-white font-black shadow-lg animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
                {!peer.isOnline && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-400 rounded-2xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-xs text-white font-black shadow-lg">
                    {peer.matchCount}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white truncate tracking-tight">{peer.name}</h4>
                  <button 
                    onClick={() => onViewProfile(peer.id)}
                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                  >
                    View Profile
                  </button>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  Peer Node • {peer.isOnline ? <span className="text-emerald-500">Active Now</span> : 'Offline'}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {peer.canTeachMe.map(s => (
                    <span key={s} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Teach: {s}</span>
                  ))}
                  {peer.canLearnFromMe.map(s => (
                    <span key={s} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20">Learn: {s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Peer Contributions Preview */}
              {(() => {
                const peerVideos = contents.filter(c => 
                  c.uploadedBy === peer.id && 
                  c.type === 'video' && 
                  (peer.canTeachMe.includes(skills.find(s => s.id === c.skillId)?.name || '') || 
                   peer.canLearnFromMe.includes(skills.find(s => s.id === c.skillId)?.name || ''))
                ).slice(0, 2);

                if (peerVideos.length === 0) return null;

                return (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matching Peer Videos</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {peerVideos.map(video => (
                        <div 
                          key={video.id}
                          onClick={() => onViewContent(video.skillId, video.id)}
                          className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative group/vid cursor-pointer border border-white/10 shadow-lg"
                        >
                          {video.url.includes('youtube.com') ? (
                            <img 
                              src={`https://img.youtube.com/vi/${video.url.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`}
                              className="w-full h-full object-cover opacity-60 group-hover/vid:opacity-100 transition-opacity"
                              alt=""
                            />
                          ) : (
                            <video src={video.url} className="w-full h-full object-cover opacity-60 group-hover/vid:opacity-100 transition-opacity" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/vid:opacity-100 transition-all scale-75 group-hover/vid:scale-100">
                              ▶
                            </div>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[8px] text-white font-black truncate">{video.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-white dark:border-white/5">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Connection Potential</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Expertise</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{peer.teachingSkills.join(', ')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Interests</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{peer.learningSkills.join(', ')}</p>
                  </div>
                </div>
              </div>

              {matchInsight?.userId === peer.id ? (
                <div className="p-6 bg-indigo-600 text-white rounded-[2rem] animate-fadeIn shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[3rem]"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                    <span>✨ AI Match Insight</span>
                  </p>
                  <p className="text-sm font-medium leading-relaxed relative z-10 italic">
                    "{matchInsight.text}"
                  </p>
                </div>
              ) : (
                <button 
                  onClick={() => generateMatchInsight(peer)}
                  disabled={isGeneratingInsight === peer.id}
                  className="w-full py-5 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] flex items-center justify-center space-x-3 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group disabled:opacity-50"
                >
                  {isGeneratingInsight === peer.id ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-xl group-hover:scale-125 transition-transform">✨</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Generate Match Suggestion</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveModal({ type: 'message', peer })}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl focus:ring-2 ring-slate-400 outline-none"
                  aria-label={`Message ${peer.name}`}
                >
                  Message Peer
                </button>
                <button 
                  onClick={() => setActiveModal({ type: 'schedule', peer })}
                  className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:ring-2 ring-indigo-400 outline-none"
                  aria-label={`Schedule meeting with ${peer.name}`}
                >
                  📅
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl border border-white dark:border-white/5 overflow-hidden animate-scaleUp">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {isSuccess ? 'Success!' : (activeModal.type === 'message' ? 'Send Message' : 'Schedule Session')}
              </h3>
              <button 
                onClick={() => { setActiveModal(null); setModalInput(''); setIsSuccess(false); }}
                className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                &times;
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {isSuccess ? (
                <div className="text-center py-10 space-y-6 animate-fadeIn">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Transmission Sent!</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      Your {activeModal.type === 'message' ? 'message' : 'meeting request'} has been delivered to <span className="text-indigo-600 font-bold">{activeModal.peer.name}</span>.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setActiveModal(null); setModalInput(''); setIsSuccess(false); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
                  >
                    Back to Matchmaker
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50">
                    <img src={activeModal.peer.avatar} className="w-12 h-12 rounded-xl object-cover shadow-md" alt="" />
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{activeModal.peer.name}</p>
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Verified Peer Node</p>
                    </div>
                  </div>

                  {activeModal.type === 'message' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Your Message</label>
                        <p className="text-[10px] text-slate-400 mb-3 ml-1 italic">Introduce yourself and mention which skills you'd like to collaborate on.</p>
                      </div>
                      <textarea 
                        autoFocus
                        className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white placeholder:text-slate-300"
                        placeholder="Hi! I saw we have matching skills in..."
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Date & Time</label>
                        <p className="text-[10px] text-slate-400 mb-3 ml-1 italic">Choose a time that works for a 30-minute introductory session.</p>
                      </div>
                      <input 
                        type="datetime-local"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                      />
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                          <span className="font-black uppercase tracking-widest block mb-1">Note:</span>
                          This will send a calendar invite to {activeModal.peer.name.split(' ')[0]}'s registered email. Make sure you're available at the selected time.
                        </p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setIsSuccess(true);
                      onAddNotification({
                        type: activeModal.type === 'message' ? 'message' : 'session',
                        title: activeModal.type === 'message' ? 'Message Sent' : 'Session Scheduled',
                        message: activeModal.type === 'message' 
                          ? `Your message to ${activeModal.peer.name} has been sent.`
                          : `Meeting with ${activeModal.peer.name} has been added to your calendar.`,
                      });
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <span>{activeModal.type === 'message' ? '🚀 Send Transmission' : '📅 Confirm Schedule'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {peerMatches.length === 0 && (
        <div className="py-32 text-center glass-card rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="text-6xl mb-8">🔍</div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No Direct Skill Matches</h3>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-2 max-w-md mx-auto">
            Try expanding your "Skills to Learn" or "Skills to Teach" in your profile to find more peer connections.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserMatching;
