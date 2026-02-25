
import React, { useState, useMemo, useRef } from 'react';
import { User, Skill, ContentItem, UserSettings } from '../types';
import { loadData } from '../store';

interface ProfileProps {
  user: User;
  currentUser: User;
  onUpdateProfile: (user: User) => void;
  onBack?: () => void;
  onViewContent?: (skillId: string, contentId: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, currentUser, onUpdateProfile, onBack, onViewContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddLearn, setShowAddLearn] = useState(false);
  const [showAddTeach, setShowAddTeach] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [newLearnSkill, setNewLearnSkill] = useState('');
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user.id === currentUser.id;
  const allData = useMemo(() => loadData(), []);

  // Helper to find icons for skills from the global database
  const getSkillIcon = (skillName: string) => {
    const globalSkill = allData.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    return globalSkill?.icon || '✨';
  };

  // Default settings if they don't exist
  const currentSettings: UserSettings = editedUser.settings || {
    theme: 'light',
    language: 'en',
    isPrivateProfile: false,
    showEmail: true,
    enableNotifications: true,
    pushNotifications: true,
    emailDigest: true,
    emailFrequency: 'weekly',
    notifyOnLikes: true,
    notifyOnComments: true,
    notifyOnNewSkills: true
  };
  
  const userHistory = useMemo(() => {
    const createdSkills = allData.skills.filter(s => s.createdBy === user.id);
    const uploadedContent = allData.contents.filter(c => c.uploadedBy === user.id);
    
    return {
      skills: createdSkills,
      content: uploadedContent
    };
  }, [allData, user.id]);

  const handleSave = () => {
    onUpdateProfile(editedUser);
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditedUser(prev => ({ ...prev, avatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!isOwnProfile) return;
    const updatedUser = {
      ...editedUser,
      settings: { ...currentSettings, [key]: value }
    };
    setEditedUser(updatedUser);
    onUpdateProfile(updatedUser);
  };

  const cycleAvatar = () => {
    if (!isOwnProfile) return;
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://picsum.photos/seed/${randomSeed}/400`;
    setEditedUser(prev => ({ ...prev, avatar: newAvatar }));
  };

  const handleAddLearnSkill = () => {
    if (newLearnSkill.trim()) {
      const updatedUser = {
        ...editedUser,
        learningSkills: [...new Set([...editedUser.learningSkills, newLearnSkill.trim()])]
      };
      setEditedUser(updatedUser);
      onUpdateProfile(updatedUser);
      setNewLearnSkill('');
      setShowAddLearn(false);
    }
  };

  const handleAddTeachSkill = () => {
    if (newTeachSkill.trim()) {
      const updatedUser = {
        ...editedUser,
        teachingSkills: [...new Set([...editedUser.teachingSkills, newTeachSkill.trim()])]
      };
      setEditedUser(updatedUser);
      onUpdateProfile(updatedUser);
      setNewTeachSkill('');
      setShowAddTeach(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn relative z-10 pb-20 space-y-12" role="main">
      {onBack && (
        <button 
          onClick={onBack} 
          aria-label="Back to directory"
          className="group flex items-center space-x-3 text-indigo-600 dark:text-indigo-400 font-black hover:text-indigo-700 transition-colors uppercase tracking-[0.2em] text-[10px] mb-4 focus:ring-2 focus:ring-indigo-500 rounded-lg outline-none"
        >
          <span className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">←</span>
          <span>Back to Directory</span>
        </button>
      )}

      <header className="relative mb-32">
        <div className="h-64 bg-gradient-to-br from-indigo-600/80 to-purple-700/80 rounded-[3rem] shadow-2xl backdrop-blur-xl border border-white/10 overflow-hidden">
           <div className="absolute inset-0 opacity-20 flex items-center justify-center text-[20rem] font-black select-none pointer-events-none uppercase">
             {user.name.split(' ')[0]}
           </div>
        </div>

        <div className="absolute top-6 right-8 flex items-center space-x-3 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/30 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
          <span className={`w-2 h-2 rounded-full ${currentSettings.isPrivateProfile ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></span>
          <span>{currentSettings.isPrivateProfile ? 'In Stealth Mode' : 'Network Active'}</span>
        </div>

        <div className="absolute -bottom-20 left-12 flex flex-col md:flex-row items-end space-x-10">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-tr from-white to-transparent rounded-[2.5rem] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative w-48 h-48 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden bg-white">
              <img src={editedUser.avatar} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={`${editedUser.name}'s avatar`} />
              
              {isOwnProfile && isEditing && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-300"
                  role="button"
                  aria-label="Upload new profile picture"
                >
                  <span className="text-4xl mb-2" aria-hidden="true">📸</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Update Image</span>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              aria-hidden="true"
            />

            {isOwnProfile && !isEditing && (
              <button 
                onClick={cycleAvatar}
                className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all z-20 border-4 border-white focus:ring-4 focus:ring-indigo-300 outline-none"
                title="Shuffle Identity"
                aria-label="Generate random avatar"
              >
                🔄
              </button>
            )}
          </div>

          <div className="pb-6">
            {isEditing ? (
              <div className="space-y-4 min-w-[300px]">
                <div>
                  <label htmlFor="display-name" className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Display Name</label>
                  <input
                    id="display-name"
                    type="text"
                    placeholder="Full Name"
                    className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter bg-white/60 dark:bg-slate-800/60 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-2 outline-none focus:ring-4 ring-indigo-500/30 w-full shadow-sm"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="email-address" className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
                  <input
                    id="email-address"
                    type="email"
                    placeholder="Email"
                    className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-4 ring-indigo-500/30 w-full"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{editedUser.name}</h2>
                <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">{editedUser.email}</p>
              </>
            )}
            
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Verified Peer Node</span>
              
              {isOwnProfile && (
                <>
                  <button 
                    onClick={() => updateSetting('isPrivateProfile', !currentSettings.isPrivateProfile)}
                    aria-pressed={currentSettings.isPrivateProfile}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${currentSettings.isPrivateProfile ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-transparent'}`}
                  >
                    <span>{currentSettings.isPrivateProfile ? '🔒 Stealth' : '🔓 Visible'}</span>
                  </button>

                  <button 
                    onClick={() => updateSetting('showEmail', !currentSettings.showEmail)}
                    aria-pressed={currentSettings.showEmail}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${currentSettings.showEmail ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-transparent'}`}
                  >
                    <span>{currentSettings.showEmail ? '📧 Public Mail' : '📧 Private Mail'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {isOwnProfile && (
          <div className="absolute -bottom-8 right-12 flex space-x-4">
            {isEditing ? (
              <>
                <button 
                  onClick={() => { setEditedUser(user); setIsEditing(false); }} 
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-slate-600 dark:text-slate-300 border border-white dark:border-white/10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-white dark:hover:bg-slate-700 transition-all text-xs focus:ring-2 ring-slate-400 outline-none"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave} 
                  className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all text-xs focus:ring-2 ring-indigo-400 outline-none"
                >
                  Confirm Sync
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-indigo-600 text-white border border-white dark:border-white/10 px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:shadow-indigo-500/40 transition-all flex items-center space-x-3 text-xs focus:ring-2 ring-indigo-400 outline-none"
              >
                <span>✏️</span>
                <span>Configure Profile</span>
              </button>
            )}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Learning Skills Hub */}
        <section className="glass-card p-10 rounded-[3rem] shadow-sm border-white/60 dark:border-white/10" aria-labelledby="learning-title">
          <div className="flex items-center justify-between mb-8">
            <h3 id="learning-title" className="text-2xl font-black flex items-center space-x-4 text-slate-800 dark:text-white">
              <span className="w-12 h-12 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-2xl" aria-hidden="true">📚</span> 
              <span className="tracking-tight">Learning Journey</span>
            </h3>
            <div className="flex items-center space-x-3">
              {isOwnProfile && (
                <button 
                  onClick={() => setShowAddLearn(!showAddLearn)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${showAddLearn ? 'bg-red-100 text-red-600 rotate-45' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-110'}`}
                  title="Add Learning Goal"
                >
                  +
                </button>
              )}
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Aspirations</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4" aria-live="polite">
              {editedUser.learningSkills.length > 0 ? editedUser.learningSkills.map(skill => (
                <div 
                  key={skill} 
                  className="bg-white/70 dark:bg-slate-800/60 border border-indigo-100 dark:border-indigo-900/40 shadow-sm text-indigo-700 dark:text-indigo-300 px-5 py-3 rounded-2xl font-bold flex items-center space-x-3 group animate-fadeIn hover:scale-105 transition-all"
                >
                  <span className="text-xl" aria-hidden="true">{getSkillIcon(skill)}</span>
                  <span>{skill}</span>
                  {isOwnProfile && (isEditing || showAddLearn) && (
                    <button
                      onClick={() => {
                        const updatedUser = { ...editedUser, learningSkills: editedUser.learningSkills.filter(s => s !== skill) };
                        setEditedUser(updatedUser);
                        onUpdateProfile(updatedUser);
                      }}
                      aria-label={`Remove ${skill} from learning skills`}
                      className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-all focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-slate-400 italic font-semibold p-4">No active learning objectives.</p>
              )}
            </div>
            
            {isOwnProfile && (isEditing || showAddLearn) && (
              <div className="mt-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 animate-fadeIn">
                <label htmlFor="new-learn-skill" className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 ml-1">New Learning Goal</label>
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none opacity-50" aria-hidden="true">{getSkillIcon(newLearnSkill)}</span>
                    <input
                      id="new-learn-skill"
                      type="text"
                      placeholder="e.g. Advanced AI"
                      className="w-full px-5 py-3.5 pl-12 bg-white/80 dark:bg-slate-800/70 border border-white dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold dark:text-white"
                      value={newLearnSkill}
                      onChange={(e) => setNewLearnSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddLearnSkill()}
                    />
                  </div>
                  <button
                    onClick={handleAddLearnSkill}
                    aria-label="Add to learning path"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all focus:ring-2 ring-indigo-400 outline-none"
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Teaching Skills Hub */}
        <section className="glass-card p-10 rounded-[3rem] shadow-sm border-white/60 dark:border-white/10" aria-labelledby="teaching-title">
          <div className="flex items-center justify-between mb-8">
            <h3 id="teaching-title" className="text-2xl font-black flex items-center space-x-4 text-slate-800 dark:text-white">
              <span className="w-12 h-12 bg-purple-100/50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-2xl" aria-hidden="true">🤝</span> 
              <span className="tracking-tight">Teaching Expertise</span>
            </h3>
            <div className="flex items-center space-x-3">
              {isOwnProfile && (
                <button 
                  onClick={() => setShowAddTeach(!showAddTeach)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${showAddTeach ? 'bg-red-100 text-red-600 rotate-45' : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:scale-110'}`}
                  title="Share Knowledge"
                >
                  +
                </button>
              )}
              <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Assets</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4" aria-live="polite">
              {editedUser.teachingSkills.length > 0 ? editedUser.teachingSkills.map(skill => (
                <div 
                  key={skill} 
                  className="bg-white/70 dark:bg-slate-800/60 border border-purple-100 dark:border-purple-900/40 shadow-sm text-purple-700 dark:text-purple-300 px-5 py-3 rounded-2xl font-bold flex items-center space-x-3 group animate-fadeIn hover:scale-105 transition-all"
                >
                  <span className="text-xl" aria-hidden="true">{getSkillIcon(skill)}</span>
                  <span>{skill}</span>
                  {isOwnProfile && (isEditing || showAddTeach) && (
                    <button
                      onClick={() => {
                        const updatedUser = { ...editedUser, teachingSkills: editedUser.teachingSkills.filter(s => s !== skill) };
                        setEditedUser(updatedUser);
                        onUpdateProfile(updatedUser);
                      }}
                      aria-label={`Remove ${skill} from teaching skills`}
                      className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-all focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-slate-400 italic font-semibold p-4">No skills offered to the peer network yet.</p>
              )}
            </div>

            {isOwnProfile && (isEditing || showAddTeach) && (
              <div className="mt-8 p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-[2rem] border border-purple-100 dark:border-purple-900/30 animate-fadeIn">
                <label htmlFor="new-teach-skill" className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 ml-1">Share Knowledge</label>
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none opacity-50" aria-hidden="true">{getSkillIcon(newTeachSkill)}</span>
                    <input
                      id="new-teach-skill"
                      type="text"
                      placeholder="e.g. Graphic Design"
                      className="w-full px-5 py-3.5 pl-12 bg-white/80 dark:bg-slate-800/70 border border-white dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all font-semibold dark:text-white"
                      value={newTeachSkill}
                      onChange={(e) => setNewTeachSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTeachSkill()}
                    />
                  </div>
                  <button
                    onClick={handleAddTeachSkill}
                    aria-label="Publish new teaching skill"
                    className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all focus:ring-2 ring-purple-400 outline-none"
                  >
                    Share
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="glass-card p-10 rounded-[3rem] shadow-sm border-white/60 dark:border-white/10" aria-labelledby="contributions-title">
        <h3 id="contributions-title" className="text-2xl font-black flex items-center space-x-4 text-slate-800 dark:text-white mb-10">
          <span className="w-12 h-12 bg-orange-100/50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-2xl" aria-hidden="true">⏱️</span> 
          <span className="tracking-tight">Network Contributions</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-1">Initiated Hubs</h4>
            <div className="space-y-4">
              {userHistory.skills.length > 0 ? userHistory.skills.map(skill => (
                <div key={skill.id} className="flex items-center space-x-4 p-5 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/60 dark:border-white/10 hover:shadow-md transition-shadow">
                  <span className="text-3xl" aria-hidden="true">{skill.icon}</span>
                  <div>
                    <p className="font-black text-slate-800 dark:text-white text-sm tracking-tight">{skill.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{skill.category}</p>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-xs font-black italic">No hubs founded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-1">Resource Repository</h4>
            <div className="space-y-4">
              {userHistory.content.length > 0 ? userHistory.content.map(content => (
                <div 
                  key={content.id} 
                  onClick={() => onViewContent?.(content.skillId, content.id)}
                  className="flex items-center justify-between p-5 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/60 dark:border-white/10 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">
                      {content.type === 'video' ? '🎬' : content.type === 'pdf' ? '📄' : content.type === 'gmeet' ? '📞' : '🔗'}
                    </span>
                    <div>
                      <p className="font-black text-slate-800 dark:text-white text-sm line-clamp-1 tracking-tight group-hover:text-indigo-600 transition-colors">{content.title}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(content.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 text-[9px] font-black">+{content.likes} PT</div>
                </div>
              )) : (
                <div className="p-10 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-xs font-black italic">No resources published yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
