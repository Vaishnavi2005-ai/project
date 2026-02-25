
import React, { useState, useRef } from 'react';
import { User, Skill } from '../types';
import { DEFAULT_DATA } from '../store';

interface DataHubProps {
  data: any;
  onUpdate: (newData: any) => void;
}

const DataHub: React.FC<DataHubProps> = ({ data, onUpdate }) => {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(data, null, 2));
  const [csvInput, setCsvInput] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'json' | 'csv'>('json');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      onUpdate(parsed);
      setStatus({ type: 'success', msg: 'Network state synchronized successfully.' });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'Invalid JSON format.' });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the entire network to factory defaults? This will clear all your data.')) {
      // Preserve the current user if possible, but reset everything else
      const resetState = {
        ...DEFAULT_DATA,
        currentUser: data.currentUser // Keep the logged in user
      };
      onUpdate(resetState);
      setJsonInput(JSON.stringify(resetState, null, 2));
      setStatus({ type: 'success', msg: 'Network reset to factory defaults.' });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleCsvImport = () => {
    if (!csvInput.trim()) {
      setStatus({ type: 'error', msg: 'Please paste the CSV data first.' });
      return;
    }

    try {
      const lines = csvInput.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      const findIdx = (keywords: string[]) => 
        headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

      const nameIdx = findIdx(['NAME']);
      const emailIdx = findIdx(['EMAIL']);
      const teachIdx = findIdx(['willing to offer']);
      const learnIdx = findIdx(['want to learn']);

      if (nameIdx === -1 || emailIdx === -1) {
        throw new Error('Required headers (NAME, EMAIL) not found in CSV.');
      }

      const newUsers: User[] = [];
      const skillNames = new Set<string>();
      const skills: Skill[] = [];

      lines.slice(1).forEach((line, index) => {
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (cols.length < 2) return;

        const name = cols[nameIdx]?.replace(/"/g, '').trim();
        const email = cols[emailIdx]?.replace(/"/g, '').trim();
        const teachRaw = cols[teachIdx]?.replace(/"/g, '').trim() || '';
        const learnRaw = cols[learnIdx]?.replace(/"/g, '').trim() || '';

        const teaching = teachRaw.split(/[,&]/).map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'na');
        const learning = learnRaw.split(/[,&]/).map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'na');

        [...teaching, ...learning].forEach(s => skillNames.add(s));

        newUsers.push({
          id: `u${index}_${Date.now()}`,
          name,
          email,
          role: 'peer', // No more admins, everyone is a peer
          avatar: `https://picsum.photos/seed/${name}/400`,
          learningSkills: learning,
          teachingSkills: teaching,
          settings: {
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
          }
        });
      });

      skillNames.forEach(skillName => {
        skills.push({
          id: `s_${skillName.toLowerCase().replace(/\s/g, '_')}`,
          name: skillName,
          description: `Collaborative learning hub for ${skillName}.`,
          category: 'General',
          icon: '💎',
          createdBy: newUsers[0].id
        });
      });

      const newState = {
        users: newUsers,
        skills,
        contents: [],
        comments: [],
        currentUser: newUsers[0]
      };

      onUpdate(newState);
      setJsonInput(JSON.stringify(newState, null, 2));
      setStatus({ type: 'success', msg: `Successfully imported ${newUsers.length} peers and generated ${skills.length} hubs.` });
      setActiveTab('json');
    } catch (e: any) {
      setStatus({ type: 'error', msg: `Import failed: ${e.message}` });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'intellipeer_backup.json');
    linkElement.click();
  };

  return (
    <div className="space-y-10 animate-fadeIn relative z-10 max-w-5xl mx-auto pb-32">
      <div className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
        <div className="p-10 border-b border-white/5 bg-gradient-to-r from-indigo-900 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black uppercase rounded">Peer Controlled</span>
              <h2 className="text-3xl font-black text-white tracking-tighter">NETWORK DATA HUB</h2>
            </div>
            <p className="text-slate-400 font-medium">Global dataset management for the peer network.</p>
          </div>
          <div className="flex gap-3">
             <button onClick={handleReset} className="px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20">🔄 Reset</button>
             <button onClick={handleExport} className="px-6 py-3 bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">💾 Export</button>
             <button 
                onClick={() => activeTab === 'json' ? handleSaveJson() : handleCsvImport()}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                Inject Dataset
             </button>
          </div>
        </div>

        <div className="p-10">
          {status && (
            <div className={`mb-8 p-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-4 animate-fadeIn ${
              status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              <span>{status.type === 'success' ? '🛡️' : '⚠️'}</span>
              <span>{status.msg}</span>
            </div>
          )}

          <div className="flex space-x-2 mb-8 p-1.5 bg-white/5 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('json')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'json' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              JSON Editor
            </button>
            <button 
              onClick={() => setActiveTab('csv')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'csv' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              CSV Pulse Import
            </button>
          </div>

          {activeTab === 'json' ? (
            <div className="relative group">
              <div className="absolute top-4 right-6 z-10 flex space-x-2">
                <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol JSON v1.0</span>
              </div>
              <textarea
                className="w-full h-[500px] bg-black/40 text-indigo-400 font-mono text-sm p-10 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/50 scrollbar-hide border border-white/5 shadow-inner leading-relaxed"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                spellCheck={false}
              ></textarea>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem]">
                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-3">SkillSwap Importer</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Paste the SkillSwap CSV data here. It will automatically generate Peer profiles and Hubs.
                </p>
              </div>
              <textarea
                className="w-full h-[400px] bg-black/40 text-emerald-400 font-mono text-sm p-10 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-emerald-500/50 scrollbar-hide border border-white/5 shadow-inner leading-relaxed"
                placeholder="Paste your CSV text here starting with headers..."
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                spellCheck={false}
              ></textarea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataHub;
