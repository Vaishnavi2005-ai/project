
import React, { useMemo } from 'react';
import { User, Skill, ContentItem } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  currentUser: User;
  users: User[];
  skills: Skill[];
  contents: ContentItem[];
  onSelectSkill: (id: string, contentId?: string) => void;
  searchQuery?: string;
  onlineUsers?: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, users, skills, contents, onSelectSkill, searchQuery = '', onlineUsers = [] }) => {
  const [immersiveFeedIndex, setImmersiveFeedIndex] = React.useState<number | null>(null);
  const [matchInsight, setMatchInsight] = React.useState<{ userId: string, text: string } | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = React.useState<string | null>(null);

  const getSkillIcon = (skillName: string) => {
    return skills.find(s => s.name === skillName)?.icon || '✨';
  };

  const recentContents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = contents.filter(c => 
      (c.title.toLowerCase().includes(query) || 
      c.uploaderName.toLowerCase().includes(query)) &&
      c.type === 'video' // Only videos for the immersive feed
    );
    return [...filtered].reverse();
  }, [contents, searchQuery]);

  const displayFeed = useMemo(() => {
    return recentContents.slice(0, 4);
  }, [recentContents]);

  const allPeers = useMemo(() => {
    const merged = [...users];
    onlineUsers.forEach(ou => {
      if (!merged.some(u => u.id === ou.id)) {
        merged.push(ou);
      }
    });
    return merged;
  }, [users, onlineUsers]);

  const popularityMap = useMemo(() => {
    const map: Record<string, number> = {};
    allPeers.forEach(user => {
      const uniqueUserSkills = new Set([...(user.learningSkills || []), ...(user.teachingSkills || [])]);
      uniqueUserSkills.forEach(skillName => {
        map[skillName] = (map[skillName] || 0) + 1;
      });
    });
    return map;
  }, [allPeers]);

  const topSkills = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return [...skills]
      .filter(s => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query))
      .sort((a, b) => (popularityMap[b.name] || 0) - (popularityMap[a.name] || 0))
      .slice(0, 5)
      .map(skill => ({
        ...skill,
        popularity: popularityMap[skill.name] || 0
      }));
  }, [skills, searchQuery, popularityMap]);

  const recommendedSkills = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const learningCategories = new Set(
      skills
        .filter(s => currentUser.learningSkills.includes(s.name))
        .map(s => s.category)
    );

    const teachingCategories = new Set(
      skills
        .filter(s => currentUser.teachingSkills.includes(s.name))
        .map(s => s.category)
    );

    let recommendations = skills.filter(s => 
      !currentUser.learningSkills.includes(s.name) && 
      !currentUser.teachingSkills.includes(s.name) &&
      (s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query))
    );

    const scoredRecommendations = recommendations.map(skill => {
      let score = 0;
      // Category match scores
      if (learningCategories.has(skill.category)) score += 15;
      if (teachingCategories.has(skill.category)) score += 8;
      
      // Popularity score (1 point per network member interested)
      score += (popularityMap[skill.name] || 0);
      
      return { skill, score };
    });

    scoredRecommendations.sort((a, b) => b.score - a.score);

    return scoredRecommendations.slice(0, 4).map(sr => sr.skill);
  }, [currentUser, skills, searchQuery, popularityMap]);

  const peerMatches = useMemo(() => {
    if (!currentUser) return [];

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
      .filter(u => u.matchCount > 0)
      .sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return b.matchCount - a.matchCount;
      })
      .slice(0, 4);
  }, [currentUser, allPeers, onlineUsers]);

  const generateMatchInsight = async (peer: any) => {
    if (isGeneratingInsight) return;
    setIsGeneratingInsight(peer.id);
    setMatchInsight(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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

  const featuredPeers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allPeers
      .map(user => {
        const uploadCount = contents.filter(c => c.uploadedBy === user.id).length;
        return {
          ...user,
          score: (user.teachingSkills.length * 2) + uploadCount,
          isOnline: onlineUsers.some(ou => ou.id === user.id)
        };
      })
      .filter(u => u.teachingSkills.length > 0 && u.name.toLowerCase().includes(query))
      .sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return b.score - a.score;
      })
      .slice(0, 3);
  }, [allPeers, contents, searchQuery, onlineUsers]);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-10 animate-fadeIn relative z-10">
      {/* Hero Welcome */}
      {!searchQuery && (
        <section className="bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-xl rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-900/20 border border-white/10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-4xl font-extrabold mb-3 tracking-tight">Welcome back, {currentUser.name}! 👋</h2>
              <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">
                You're currently mastering {currentUser.learningSkills.length} skills and sharing your knowledge with {allPeers.length - 1} peers.
                {onlineUsers.length > 1 && (
                  <span className="block mt-2 font-black text-emerald-300 animate-pulse">
                    ⚡ {onlineUsers.length - 1} other peers are online right now!
                  </span>
                )}
              </p>
            </div>
            <div className="mt-8 md:mt-0 flex items-center space-x-6 bg-black/10 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
              <div className="text-center px-4 border-r border-white/10">
                <p className="text-3xl font-black">{allPeers.length}</p>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">Network</p>
              </div>
              <div className="text-center px-4">
                <p className="text-3xl font-black">{skills.length}</p>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">Skills Hubs</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid: Goals, Teaching, Popularity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!searchQuery && (
          <div className="glass-card p-8 rounded-[2rem] shadow-sm dark:border-white/10">
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-3 text-slate-800 dark:text-white">
              <span className="w-10 h-10 bg-indigo-100/50 dark:bg-slate-800 rounded-xl flex items-center justify-center">🎓</span>
              <span>Your Learning Path</span>
            </h3>
            <div className="space-y-3">
              {currentUser.learningSkills.length > 0 ? currentUser.learningSkills.map(skill => (
                <div key={skill} className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/60 transition-all cursor-pointer group shadow-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getSkillIcon(skill)}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{skill}</span>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black group-hover:translate-x-1 transition-transform">→</span>
                </div>
              )) : <p className="text-slate-400 italic text-sm p-4 text-center">No skills added yet.</p>}
            </div>
          </div>
        )}

        {!searchQuery && (
          <div className="glass-card p-8 rounded-[2rem] shadow-sm dark:border-white/10">
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-3 text-slate-800 dark:text-white">
              <span className="w-10 h-10 bg-purple-100/50 dark:bg-slate-800 rounded-xl flex items-center justify-center">🤝</span>
              <span>Your Knowledge Share</span>
            </h3>
            <div className="space-y-3">
              {currentUser.teachingSkills.length > 0 ? currentUser.teachingSkills.map(skill => (
                <div key={skill} className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/60 transition-all cursor-pointer group shadow-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getSkillIcon(skill)}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{skill}</span>
                  </div>
                  <span className="text-purple-600 dark:text-purple-400 font-black group-hover:translate-x-1 transition-transform">→</span>
                </div>
              )) : <p className="text-slate-400 italic text-sm p-4 text-center">Share your skills to help others!</p>}
            </div>
          </div>
        )}

        <div className={`glass-card p-8 rounded-[2rem] shadow-sm dark:border-white/10 ${!searchQuery ? 'md:col-span-2 lg:col-span-1' : 'col-span-full'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center space-x-3 text-slate-800 dark:text-white">
              <span className="w-10 h-10 bg-orange-100/50 dark:bg-slate-800 rounded-xl flex items-center justify-center">🔥</span>
              <span>{searchQuery ? 'Matching Hubs' : 'Trending Skills'}</span>
            </h3>
          </div>
          <div className={`space-y-2.5 ${searchQuery ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0' : ''}`}>
            {topSkills.map((skill, index) => (
              <button
                key={skill.id}
                onClick={() => onSelectSkill(skill.id)}
                className="w-full flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-indigo-600 hover:text-white hover:shadow-lg transition-all group"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-xs font-black text-slate-300 w-4 group-hover:text-white/50">#{index + 1}</span>
                  <span className="text-2xl">{skill.icon}</span>
                  <span className="font-bold text-sm truncate dark:text-white group-hover:text-white">{skill.name}</span>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                   <span className="text-[10px] font-black bg-white dark:bg-slate-700 group-hover:bg-white/20 group-hover:text-white px-2.5 py-1 rounded-full shadow-sm dark:text-white">{skill.popularity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center space-x-3">
            <span className="text-indigo-600">✨</span>
            <span>{searchQuery ? 'Relevant Knowledge Hubs' : 'Personalized Recommendations'}</span>
          </h3>
          {!searchQuery && (
            <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Based on your interests</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>Network trends</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {recommendedSkills.map(skill => (
            <div 
              key={skill.id}
              onClick={() => onSelectSkill(skill.id)}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white dark:border-white/5 cursor-pointer hover:shadow-2xl hover:translate-y-[-10px] transition-all relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[5rem] pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  {skill.icon}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg tracking-widest shadow-lg shadow-indigo-500/20">
                    {skill.category}
                  </span>
                  {popularityMap[skill.name] > 2 && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[8px] font-black uppercase rounded-lg tracking-widest border border-orange-200">
                      Trending
                    </span>
                  )}
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                  {skill.name}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 font-medium leading-relaxed">
                  {skill.description}
                </p>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-indigo-50 flex items-center justify-center text-[8px] font-black text-indigo-600">
                      +{popularityMap[skill.name] || 0}
                    </div>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                    Join Hub →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Peer Matches Section */}
      {!searchQuery && peerMatches.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center space-x-3">
              <span className="text-purple-600">🤝</span>
              <span>Skill Connections</span>
            </h3>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onSelectSkill('matching')} // We'll handle this special case in App.tsx or just use a new prop
                className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline"
              >
                View All Matches →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {peerMatches.map(peer => (
              <div 
                key={peer.id}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white dark:border-white/5 shadow-sm hover:shadow-2xl transition-all group flex items-center gap-8"
              >
                <div className="relative shrink-0">
                  <img src={peer.avatar} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white dark:border-slate-700 shadow-xl" alt={peer.name} />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center text-[10px] text-white font-black">
                    {peer.matchCount}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 truncate">{peer.name}</h4>
                  
                  <div className="space-y-3">
                    {peer.canTeachMe.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">Can Teach You:</span>
                        <div className="flex flex-wrap gap-1">
                          {peer.canTeachMe.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-bold">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {peer.canLearnFromMe.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest shrink-0">Wants to Learn:</span>
                        <div className="flex flex-wrap gap-1">
                          {peer.canLearnFromMe.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md text-[9px] font-bold">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {matchInsight?.userId === peer.id && (
                    <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl animate-fadeIn">
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span>✨ AI Suggestion</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {matchInsight.text}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => generateMatchInsight(peer)}
                    disabled={isGeneratingInsight === peer.id}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                      isGeneratingInsight === peer.id 
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-400' 
                        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                    }`}
                    title="Get AI Collaboration Suggestion"
                  >
                    {isGeneratingInsight === peer.id ? (
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : '✨'}
                  </button>
                  <button 
                    className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shrink-0"
                    title="Connect with Peer"
                  >
                    💬
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-card p-10 rounded-[3rem] shadow-sm relative overflow-hidden dark:border-white/10">
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Peer Learning Feed</h3>
            <p className="text-slate-500 dark:text-slate-400 font-semibold mt-1">Watch and learn from the latest peer contributions.</p>
          </div>
          <div className="flex items-center space-x-4">
            {recentContents.length > 0 && (
              <button 
                onClick={() => setImmersiveFeedIndex(0)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
              >
                <span>🎬 Start Immersive Feed</span>
              </button>
            )}
            <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">View All Feed →</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {displayFeed.map((content, idx) => (
            <div
              key={content.id}
              className="group cursor-pointer flex flex-col h-full"
              onClick={() => setImmersiveFeedIndex(idx)}
            >
              <div className="aspect-[9/16] bg-slate-900 rounded-[2.5rem] mb-5 relative overflow-hidden border border-white/60 dark:border-white/10 shadow-2xl group-hover:shadow-indigo-500/20 transition-all duration-500">
                {content.type === 'video' ? (
                  getYoutubeId(content.url) ? (
                    <img 
                      src={`https://img.youtube.com/vi/${getYoutubeId(content.url)}/maxresdefault.jpg`}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                      onError={(e) => {
                        // Fallback if maxresdefault is not available
                        e.currentTarget.src = `https://img.youtube.com/vi/${getYoutubeId(content.url)}/mqdefault.jpg`;
                      }}
                    />
                  ) : (
                    <video 
                      src={content.url} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" 
                      muted
                      onMouseOver={(e) => e.currentTarget.play()}
                      onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900">
                    <div className="text-7xl group-hover:scale-110 transition-transform duration-700">
                      {content.type === 'pdf' ? '📄' : content.type === 'gmeet' ? '📞' : content.type === 'live' ? '📹' : '🔗'}
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                
                <div className="absolute top-6 left-6 px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[9px] rounded-xl uppercase font-black tracking-widest border border-white/20">
                  {content.type}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <h4 className="font-black text-white text-lg leading-tight line-clamp-2 tracking-tight mb-2">{content.title}</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[10px]">👤</div>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest truncate">{content.uploaderName}</p>
                  </div>
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-2xl border border-white/30">
                    ▶
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Immersive Feed Overlay */}
      {immersiveFeedIndex !== null && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-fadeIn">
          <button 
            onClick={() => setImmersiveFeedIndex(null)}
            className="absolute top-8 right-8 z-[210] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center text-2xl transition-all border border-white/10"
          >
            &times;
          </button>

          <div className="w-full h-full max-w-lg relative flex flex-col justify-center">
            <div className="aspect-[9/16] bg-slate-900 relative overflow-hidden shadow-2xl">
              {recentContents[immersiveFeedIndex].type === 'video' && (
                getYoutubeId(recentContents[immersiveFeedIndex].url) ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYoutubeId(recentContents[immersiveFeedIndex].url)}?autoplay=1&controls=1`}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    key={recentContents[immersiveFeedIndex].id}
                    src={recentContents[immersiveFeedIndex].url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                )
              )}

              {/* Feed Info Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                <div className="flex items-center space-x-4 mb-4">
                  <img src={`https://picsum.photos/seed/${recentContents[immersiveFeedIndex].uploadedBy}/200`} className="w-12 h-12 rounded-full border-2 border-white/20" alt="uploader" />
                  <div>
                    <p className="text-white font-black text-lg tracking-tight">{recentContents[immersiveFeedIndex].uploaderName}</p>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Shared in {skills.find(s => s.id === recentContents[immersiveFeedIndex].skillId)?.name}</p>
                  </div>
                </div>
                <h4 className="text-white text-xl font-black tracking-tight mb-2">{recentContents[immersiveFeedIndex].title}</h4>
                <p className="text-white/70 text-sm line-clamp-2 font-medium">{recentContents[immersiveFeedIndex].description}</p>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute inset-y-0 -left-20 flex items-center">
              <button 
                disabled={immersiveFeedIndex === 0}
                onClick={() => setImmersiveFeedIndex(immersiveFeedIndex - 1)}
                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center text-2xl transition-all border border-white/10 disabled:opacity-20"
              >
                ↑
              </button>
            </div>
            <div className="absolute inset-y-0 -right-20 flex items-center">
              <button 
                disabled={immersiveFeedIndex === recentContents.length - 1}
                onClick={() => setImmersiveFeedIndex(immersiveFeedIndex + 1)}
                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center text-2xl transition-all border border-white/10 disabled:opacity-20"
              >
                ↓
              </button>
            </div>

            <div className="absolute bottom-8 right-[-100px] flex flex-col items-center space-y-6">
              <button 
                onClick={() => {
                  onSelectSkill(recentContents[immersiveFeedIndex].skillId, recentContents[immersiveFeedIndex].id);
                  setImmersiveFeedIndex(null);
                }}
                className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-2xl hover:scale-110 transition-all border border-indigo-500"
                title="View Skill Hub"
              >
                🎓
              </button>
              <div className="text-center">
                <p className="text-white font-black text-xs">{immersiveFeedIndex + 1} / {recentContents.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
