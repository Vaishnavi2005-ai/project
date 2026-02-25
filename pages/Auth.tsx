
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, users }) => {
  const [isLogin, setIsLogin] = useState(users.length > 0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [learningSkillsInput, setLearningSkillsInput] = useState('');
  const [teachingSkillsInput, setTeachingSkillsInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = users.find(u => u.email === email);
      if (user) {
        onLogin(user);
      } else {
        setError('User not found. Please check your email or sign up!');
      }
    } else {
      if (!name || !email) {
        setError('Please fill in all fields');
        return;
      }

      if (users.some(u => u.email === email)) {
        setError('This email is already registered. Try logging in.');
        return;
      }
      
      const learningSkills = learningSkillsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
        
      const teachingSkills = teachingSkillsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const newUser: User = {
        id: 'u' + Date.now(),
        name,
        email,
        role: 'peer', // Everyone is a peer
        avatar: `https://picsum.photos/seed/${name}/200`,
        learningSkills,
        teachingSkills,
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
      };
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-y-auto">
      {/* Decorative AI elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-lg glass-card rounded-[2.5rem] shadow-2xl overflow-hidden animate-popIn relative z-10 border border-white/40 my-10">
        <div className="p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[1.5rem] mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl shadow-indigo-500/30">
              IP
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">IntelliPeer</h1>
            <p className="text-slate-500 font-semibold mt-2">
              Join the decentralized peer knowledge hub.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input
                required
                type="email"
                placeholder="you@university.edu"
                className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Skills you want to learn</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, UI Design"
                    className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                    value={learningSkillsInput}
                    onChange={(e) => setLearningSkillsInput(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Skills you can teach</label>
                  <input
                    type="text"
                    placeholder="e.g. Math, Web Dev"
                    className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                    value={teachingSkillsInput}
                    onChange={(e) => setTeachingSkillsInput(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-bold text-center animate-bounce">{error}</p>}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-indigo-500/40 transform active:scale-95 transition-all mt-4 shadow-xl"
            >
              {isLogin ? 'ENTER HUB' : 'START JOURNEY'}
            </button>
          </form>

          {users.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-slate-500 text-sm font-bold hover:text-indigo-600 transition-colors"
              >
                {isLogin ? "Don't have an account? Create one" : "Already a member? Log in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
