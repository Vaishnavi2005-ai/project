
import React, { useMemo } from 'react';
import { User } from '../types';

interface NetworkProps {
  users: User[];
  searchQuery: string;
  onViewProfile: (userId: string) => void;
  onlineUsers?: User[];
}

const Network: React.FC<NetworkProps> = ({ users, searchQuery, onViewProfile, onlineUsers = [] }) => {
  const allPeers = useMemo(() => {
    // Merge local users and online users, removing duplicates by ID
    const merged = [...users];
    onlineUsers.forEach(onlineUser => {
      if (!merged.some(u => u.id === onlineUser.id)) {
        merged.push(onlineUser);
      }
    });
    return merged;
  }, [users, onlineUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allPeers.filter(u => {
      // Data Revelation Filter: Do not show users who have enabled "Private Profile"
      if (u.settings?.isPrivateProfile) return false;

      return (
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) ||
        u.teachingSkills.some(s => s.toLowerCase().includes(query))
      );
    });
  }, [allPeers, searchQuery]);

  return (
    <div className="space-y-10 animate-fadeIn relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Peer Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-2">Connect with {filteredUsers.length} public minds in the network.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredUsers.map((user) => (
          <div key={user.id} className="glass-card rounded-[2.5rem] p-8 border border-white/60 dark:border-white/10 hover:shadow-2xl hover:translate-y-[-8px] transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[4rem] group-hover:bg-indigo-500/10 transition-colors"></div>
            
            <div className="relative mb-6">
              <img src={user.avatar} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl bg-white" alt={user.name} />
              {onlineUsers.some(ou => ou.id === user.id) && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-2xl border-4 border-white shadow-lg animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h3>
            
            {/* Email Revelation Logic */}
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 mb-6 truncate">
              {user.settings?.showEmail ? user.email : '🔒 Peer Protected'}
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {user.teachingSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase">{skill}</span>
                  ))}
                  {user.teachingSkills.length > 3 && <span className="text-[10px] text-slate-400 font-bold">+{user.teachingSkills.length - 3} more</span>}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Learning</p>
                <div className="flex flex-wrap gap-2">
                  {user.learningSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => onViewProfile(user.id)}
              className="w-full mt-8 py-4 bg-white/50 dark:bg-slate-800/50 hover:bg-indigo-600 hover:text-white border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              View Peer Profile
            </button>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-24 text-center glass-card rounded-[3rem] border border-dashed border-slate-300">
           <span className="text-6xl mb-6 block">👻</span>
           <h3 className="text-2xl font-black text-slate-800">No peers found</h3>
           <p className="text-slate-500 font-bold">Try searching with a different name or skill.</p>
        </div>
      )}
    </div>
  );
};

export default Network;
