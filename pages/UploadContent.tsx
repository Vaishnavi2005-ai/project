
import React, { useState } from 'react';
import { Skill, ContentItem, ContentType, User } from '../types';

interface UploadProps {
  skills: Skill[];
  onUpload: (content: ContentItem) => void;
  currentUser: User;
  preSelectedSkillId?: string | null;
}

const UploadContent: React.FC<UploadProps> = ({ skills, onUpload, currentUser, preSelectedSkillId }) => {
  const [formData, setFormData] = useState({
    skillId: preSelectedSkillId || '',
    title: '',
    description: '',
    type: 'video' as ContentType,
    url: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFormData({ ...formData, url: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.skillId && formData.title && (formData.url || file)) {
      onUpload({
        ...formData,
        id: 'c' + Date.now(),
        uploadedBy: currentUser.id,
        uploaderName: currentUser.name,
        timestamp: new Date().toISOString(),
        likes: 0,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn relative z-10 pb-20">
      <div className="glass-card rounded-[3rem] shadow-2xl border-white/40 dark:border-white/10 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 text-white">
          <h2 className="text-4xl font-black tracking-tight mb-2 uppercase tracking-tighter">Publish Knowledge</h2>
          <p className="text-indigo-100 font-semibold opacity-90 leading-relaxed">
            Contribute to the peer network. Host a <span className="text-white font-black underline">Google Meet</span>, upload a video, or share a guide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Knowledge Hub</label>
              <select
                required
                className="w-full px-5 py-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 dark:text-white shadow-sm transition-all"
                value={formData.skillId}
                onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
              >
                <option value="">-- Choose a Hub --</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Content Format</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['video', 'pdf', 'gmeet', 'live', 'external'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type, url: '' })}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest ${
                      formData.type === type 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105' 
                        : 'bg-white/40 dark:bg-slate-800/40 text-slate-500 border border-white/60 dark:border-white/10'
                    }`}
                  >
                    {type === 'gmeet' ? 'Meet' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Resource Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Master Advanced Node.js Architectures"
              className="w-full px-5 py-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold shadow-sm transition-all dark:text-white"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Resource Overview</label>
            <textarea
              className="w-full px-5 py-4 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none font-semibold shadow-sm transition-all dark:text-white"
              placeholder="Break down what peers will gain from this resource..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          {formData.type === 'video' || formData.type === 'pdf' ? (
            <div className="p-12 border-4 border-dashed border-indigo-200/50 dark:border-indigo-900/30 rounded-[2rem] text-center bg-white/30 dark:bg-slate-900/10 hover:bg-white dark:hover:bg-slate-800/30 transition-all group cursor-pointer relative">
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={formData.type === 'video' ? 'video/*' : '.pdf'}
                onChange={handleFileChange}
              />
              <div className="pointer-events-none">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {formData.type === 'video' ? '🎬' : '📄'}
                </div>
                <p className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">Select {formData.type} File</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Maximum Cloud Transfer: 1GB</p>
                {file && (
                  <div className="mt-6 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl inline-block text-xs font-black text-green-600 animate-fadeIn">
                    ✓ {file.name}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">
                {formData.type === 'gmeet' ? 'Google Meet URL' : formData.type === 'live' ? 'Synchronous Session Link' : 'External Asset Link'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400">{formData.type === 'gmeet' ? '📞' : '🔗'}</span>
                </div>
                <input
                  required
                  type="url"
                  placeholder={formData.type === 'gmeet' ? "https://meet.google.com/abc-defg-hij" : "https://peerlink.intellipeer.hub/..."}
                  className="w-full px-5 py-4 pl-12 bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs shadow-sm transition-all dark:text-white"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-[0.25em] hover:shadow-2xl hover:shadow-indigo-500/30 transform active:scale-95 transition-all text-sm"
          >
            🚀 Launch into Hub
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadContent;
