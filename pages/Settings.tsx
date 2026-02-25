
import React, { useState, useEffect } from 'react';
import { User, UserSettings, ThemeMode, LanguageCode, EmailFrequency } from '../types';

interface SettingsProps {
  user: User;
  onUpdateSettings: (settings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateSettings }) => {
  const [settings, setSettings] = useState<UserSettings>(user.settings || {
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
  });

  useEffect(() => {
    // Apply theme to body
    const body = document.body;
    body.classList.remove('dark-theme', 'monochrome-theme');
    if (settings.theme === 'dark') body.classList.add('dark-theme');
    if (settings.theme === 'monochrome') body.classList.add('monochrome-theme');
  }, [settings.theme]);

  const updateSetting = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const toggleSetting = (key: keyof UserSettings) => {
    updateSetting(key, !settings[key as keyof UserSettings]);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn relative z-10 space-y-10 pb-32">
      {/* Header Section */}
      <div className="flex items-center space-x-6 mb-8 bg-white/20 dark:bg-slate-800/20 p-8 rounded-[3rem] border border-white/40 dark:border-white/5 shadow-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[1.75rem] flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/30">⚙️</div>
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Node Configuration</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-1">Fine-tune your peer interface and data streams.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        
        {/* Visual & Language Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section className="glass-card p-10 rounded-[2.5rem] shadow-sm border-white/60 dark:border-white/10">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center space-x-3 mb-8">
              <span className="w-10 h-10 bg-blue-100/50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl">🌐</span>
              <span>Interface</span>
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Native Language</p>
                <div className="flex space-x-3">
                  {(['en', 'ta'] as LanguageCode[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => updateSetting('language', lang)}
                      className={`flex-1 py-4 rounded-2xl font-black transition-all border ${
                        settings.language === lang 
                          ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20' 
                          : 'bg-white/40 dark:bg-slate-800/40 text-slate-500 border-white/60 dark:border-white/10 hover:bg-white'
                      }`}
                    >
                      {lang === 'en' ? 'English' : 'தமிழ்'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Visual Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'monochrome'] as ThemeMode[]).map(t => (
                    <button
                      key={t}
                      onClick={() => updateSetting('theme', t)}
                      className={`py-5 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all ${
                        settings.theme === t 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-white/40 dark:bg-slate-800/40 text-slate-400 border-white/60 dark:border-white/10 hover:bg-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card p-10 rounded-[2.5rem] shadow-sm border-white/60 dark:border-white/10">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center space-x-3 mb-8">
              <span className="w-10 h-10 bg-purple-100/50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl">🔒</span>
              <span>Visibility</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">Stealth Identity</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Hidden from global search</p>
                </div>
                <button
                  onClick={() => toggleSetting('isPrivateProfile')}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.isPrivateProfile ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.isPrivateProfile ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-5 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">Email Transparency</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Visible to peer collaborators</p>
                </div>
                <button
                  onClick={() => toggleSetting('showEmail')}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.showEmail ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.showEmail ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Detailed Notifications Section */}
        <section className="glass-card p-10 rounded-[3rem] shadow-sm border-white/60 dark:border-white/10">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center space-x-4 mb-10">
            <span className="w-12 h-12 bg-orange-100/50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-2xl">🔔</span>
            <span>Intelligent Alerts</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Push Notifications Column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Live Push Stream</h4>
                <button
                  onClick={() => toggleSetting('pushNotifications')}
                  className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${settings.pushNotifications ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.pushNotifications ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
              
              <div className={`space-y-4 transition-all duration-500 ${settings.pushNotifications ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Resource Appreciations (Likes)</span>
                  <input type="checkbox" checked={settings.notifyOnLikes} onChange={() => toggleSetting('notifyOnLikes')} className="w-5 h-5 accent-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Peer Discussion (Comments)</span>
                  <input type="checkbox" checked={settings.notifyOnComments} onChange={() => toggleSetting('notifyOnComments')} className="w-5 h-5 accent-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">New Category Launch</span>
                  <input type="checkbox" checked={settings.notifyOnNewSkills} onChange={() => toggleSetting('notifyOnNewSkills')} className="w-5 h-5 accent-indigo-600 rounded" />
                </div>
              </div>
            </div>

            {/* Email Digest Column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Knowledge Digests</h4>
                <button
                  onClick={() => toggleSetting('emailDigest')}
                  className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${settings.emailDigest ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.emailDigest ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className={`space-y-6 transition-all duration-500 ${settings.emailDigest ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-[2rem] border border-purple-100 dark:border-purple-900/20">
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4">Transmission Frequency</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['off', 'daily', 'weekly'] as EmailFrequency[]).map(freq => (
                      <button
                        key={freq}
                        onClick={() => updateSetting('emailFrequency', freq)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                          settings.emailFrequency === freq 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'bg-white/60 dark:bg-slate-800/60 text-slate-500 border border-white dark:border-white/10'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-4 italic leading-relaxed">
                    Weekly digests are sent every Monday at 08:00 UTC. Daily digests summarize previous 24h activity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pt-10 text-center">
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] opacity-40">End of Control Surface • IntelliPeer Protocol</p>
      </div>
    </div>
  );
};

export default Settings;
