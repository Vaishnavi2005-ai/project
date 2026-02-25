
import React, { useState } from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  selectedSkillId?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  unreadNotifications?: number;
  onToggleNotifications?: () => void;
  onlineUsers?: User[];
  onCloseSubView?: () => void;
  isSubViewActive?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  currentUser, 
  onLogout, 
  selectedSkillId,
  searchQuery,
  onSearchChange,
  unreadNotifications = 0,
  onToggleNotifications,
  onlineUsers = [],
  onCloseSubView,
  isSubViewActive = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Common items available to all peers
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'skills', label: 'Skills', icon: '📚' },
    { id: 'network', label: 'Network', icon: '👥' },
    { id: 'matching', label: 'Matchmaker', icon: '🤝' },
    { id: 'upload', label: 'Upload Content', icon: '📤' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Only show Data Hub to the designated Editor
  if (currentUser?.isEditor) {
    navItems.splice(navItems.length - 1, 0, { id: 'data-hub', label: 'Network Console', icon: '⚡' });
  }

  return (
    <div className="flex min-h-screen relative">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 sidebar-glass border-r border-white/30 transform transition-transform duration-300 ease-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-indigo-500/20">
              IP
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">
              IntelliPeer
            </span>
          </div>

          <nav className="flex-1 px-6 space-y-1 mt-4 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-[1.25rem] transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-indigo-600 text-white font-black shadow-xl shadow-indigo-500/30'
                    : 'text-slate-500 hover:bg-white/40 hover:text-slate-900 dark:hover:bg-white/10 dark:text-slate-400'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-bold tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6">
            <div className="p-5 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-white/60 dark:border-white/10 shadow-sm">
              <div className="flex items-center space-x-4">
                <img src={currentUser?.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover bg-white" alt="avatar" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate opacity-70">
                    {currentUser?.isEditor ? 'Editor Node' : 'Peer Node'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50/50 rounded-xl transition-all uppercase tracking-widest"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 transition-all duration-300">
        <header className="sticky top-0 z-40 bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border-b border-white/30 dark:border-white/10 px-8 py-5 flex items-center justify-between gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-xl"
          >
            ☰
          </button>
          
          <div className="hidden sm:flex items-center space-x-4">
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.15em] whitespace-nowrap">
              {selectedSkillId ? 'Resource Hub' : activeTab.replace('-', ' ')}
            </h1>
            {isSubViewActive && onCloseSubView && (
              <button 
                onClick={onCloseSubView}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2"
              >
                <span>✕</span>
                <span>Close Tab</span>
              </button>
            )}
          </div>

          <div className="flex-1 max-w-xl relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search skills or peers..."
              className="w-full bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:text-white"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6 shrink-0 relative">
             {onlineUsers.length > 0 && (
               <div className="flex items-center space-x-2 mr-2">
                 <div className="flex -space-x-2 overflow-hidden">
                   {onlineUsers.slice(0, 3).map((user) => (
                     <img
                       key={user.id}
                       className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover bg-white"
                       src={user.avatar}
                       alt={user.name}
                       title={`${user.name} is online`}
                     />
                   ))}
                   {onlineUsers.length > 3 && (
                     <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">
                       +{onlineUsers.length - 3}
                     </div>
                   )}
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Live</span>
                   <span className="text-[10px] font-bold text-slate-400 leading-none">{onlineUsers.length} Peers</span>
                 </div>
               </div>
             )}
             <button 
               onClick={onToggleNotifications}
               className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center text-xl cursor-pointer hover:scale-110 transition-transform shadow-sm relative"
             >
               🔔
               {unreadNotifications > 0 && (
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                   {unreadNotifications}
                 </span>
               )}
             </button>
          </div>
        </header>

        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
