
import React, { useState, useMemo } from 'react';
import { Skill, User } from '../types';

interface SkillsProps {
  skills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onSelectSkill: (id: string) => void;
  currentUser: User;
  searchQuery?: string;
  onToggleLearn: (skillName: string) => void;
  onToggleTeach: (skillName: string) => void;
  onGoToUpload: (skillId: string) => void;
}

const Skills: React.FC<SkillsProps> = ({ 
  skills, 
  onAddSkill, 
  onSelectSkill, 
  currentUser, 
  searchQuery = '',
  onToggleLearn,
  onToggleTeach,
  onGoToUpload
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', category: '', icon: '🌟' });
  const [uploadAfterCreate, setUploadAfterCreate] = useState(false);

  const filteredSkills = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return skills.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.category.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    );
  }, [skills, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.name && newSkill.category) {
      const skillId = 's' + Date.now();
      onAddSkill({
        ...newSkill,
        id: skillId,
        createdBy: currentUser.id,
      });
      setShowAddModal(false);
      
      if (uploadAfterCreate) {
        onGoToUpload(skillId);
      }
      
      setNewSkill({ name: '', description: '', category: '', icon: '🌟' });
      setUploadAfterCreate(false);
    }
  };

  const categories = useMemo(() => 
    Array.from(new Set(filteredSkills.map(s => s.category))),
  [filteredSkills]);

  return (
    <div className="space-y-12 animate-fadeIn relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {searchQuery ? `Search Results: "${searchQuery}"` : 'Explore Skills'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-2">
            {searchQuery ? `Found ${filteredSkills.length} matching skills.` : 'Discover what your peers are teaching in the global network.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3 uppercase text-sm tracking-widest"
        >
          <span>➕</span>
          <span>Create Category</span>
        </button>
      </div>

      {categories.length > 0 ? categories.map(category => (
        <section key={category} className="space-y-6">
          <div className="flex items-center space-x-4">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] bg-white/40 dark:bg-slate-800/40 px-6 py-2 rounded-full border border-white/60 dark:border-white/10 shadow-sm">{category}</h3>
             <div className="flex-1 h-px bg-gradient-to-r from-white/60 dark:from-white/10 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredSkills.filter(s => s.category === category).map(skill => {
              const isLearning = currentUser.learningSkills.includes(skill.name);
              const isTeaching = currentUser.teachingSkills.includes(skill.name);

              return (
                <div
                  key={skill.id}
                  className="glass-card p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:translate-y-[-10px] transition-all cursor-pointer group border-white/60 dark:border-white/10 flex flex-col h-full"
                >
                  <div onClick={() => onSelectSkill(skill.id)} className="flex-1">
                    <div className="w-16 h-16 bg-white/40 dark:bg-slate-800/40 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">{skill.icon}</div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors tracking-tight">{skill.name}</h4>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">{skill.description}</p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLearn(skill.name);
                        }}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isLearning 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/60 dark:border-white/10 hover:bg-emerald-50'
                        }`}
                      >
                        {isLearning ? '✓ Learning' : 'Learn Skill'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTeach(skill.name);
                          if (!isTeaching) onGoToUpload(skill.id);
                        }}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isTeaching 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/60 dark:border-white/10 hover:bg-purple-50'
                        }`}
                      >
                        {isTeaching ? '✓ Teaching' : 'Teach Skill'}
                      </button>
                    </div>
                    
                    <div 
                      onClick={() => onSelectSkill(skill.id)}
                      className="pt-4 border-t border-white/40 dark:border-white/10 flex items-center justify-between"
                    >
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                        {isTeaching ? 'Your Hub' : 'Active Hub'}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">Enter Hub →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )) : (
        <div className="py-20 text-center glass-card rounded-[3rem] border border-white/40 dark:border-white/10">
          <div className="text-6xl mb-6">🔍</div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">No skills found</h3>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-2">Try adjusting your search terms or create a new hub.</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-950/20 backdrop-blur-md p-4">
          <div className="glass-card rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-popIn border-white/40 dark:border-white/10">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-widest">New Skill Category</h3>
              <button onClick={() => setShowAddModal(false)} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Skill Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Master React"
                    className="w-full px-5 py-4 bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Programming"
                    className="w-full px-5 py-4 bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Icon (Emoji)</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-center text-xl dark:text-white"
                    value={newSkill.icon}
                    onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Core Description</label>
                <textarea
                  className="w-full px-5 py-4 bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none h-28 resize-none dark:text-white"
                  placeholder="What knowledge is shared here?"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                ></textarea>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50">
                <input 
                  type="checkbox" 
                  id="uploadAfter"
                  className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={uploadAfterCreate}
                  onChange={(e) => setUploadAfterCreate(e.target.checked)}
                />
                <label htmlFor="uploadAfter" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Upload video or PDF immediately after creation
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-indigo-500/40 transition-all"
              >
                Launch Hub
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Skills;
