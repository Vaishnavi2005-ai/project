
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, Skill, ContentItem } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatBotProps {
  currentUser: User;
  allSkills: Skill[];
  allUsers: User[];
  allContents: ContentItem[];
}

const AIChatBot: React.FC<AIChatBotProps> = ({ currentUser, allSkills, allUsers, allContents }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${currentUser.name}! I'm your AI Peer Mentor. How can I help you master your skills today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat session on first open or when currentUser changes
  useEffect(() => {
    if (isOpen && !chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
      
      const systemInstruction = `
        You are the "AI Peer Mentor" for the IntelliPeer platform.
        Platform Context:
        - Current User: ${currentUser.name} (ID: ${currentUser.id})
        - User's Learning Path: ${currentUser.learningSkills.join(', ')}
        - User's Teaching Expertise: ${currentUser.teachingSkills.join(', ')}
        
        Available Resources in the Network:
        ${allSkills.map(s => `- Skill Hub: ${s.name} (${s.description})`).join('\n')}
        
        Peers in the Network:
        ${allUsers.filter(u => u.id !== currentUser.id).map(u => `- ${u.name}: Expertise in ${u.teachingSkills.join(', ')}`).join('\n')}

        Your Goals:
        1. Answer user questions about learning and the platform.
        2. Proactively suggest relevant Skill Hubs or specific peers based on what the user is currently learning.
        3. If a user is struggling with a skill, suggest a peer who is teaching that skill.
        4. Maintain a helpful, encouraging, and peer-like tone.
        5. Remember the conversation history to provide context-aware responses.
        6. Keep responses concise but impactful.
      `;

      chatRef.current = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    }
  }, [isOpen, currentUser, allSkills, allUsers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        // Fallback if chat session wasn't initialized
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
        chatRef.current = ai.chats.create({
          model: 'gemini-3.1-pro-preview',
          config: {
            systemInstruction: `You are the AI Peer Mentor for ${currentUser.name}.`,
          }
        });
      }

      const response = await chatRef.current.sendMessage({ message: userMessage });
      const aiText = response.text || "I'm having a bit of a brain fog, can you rephrase that?";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I lost connection to the peer network. Try again later!" }]);
      // Reset chat on error to try and recover
      chatRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-sans">
      {isOpen ? (
        <div ref={chatRef} className="w-[400px] h-[600px] glass-card rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-popIn border-indigo-500/30">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">AI Peer Mentor</h3>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-bold opacity-80">ACTIVE PRO-3 PREVIEW</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all"
              >
                Close
              </button>
              <button onClick={() => setIsOpen(false)} className="text-2xl hover:scale-110 transition-transform">&times;</button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-white dark:border-white/5'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {!isLoading && messages.length > 1 && messages[messages.length - 1].role === 'model' && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Done / Close Chat
                </button>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-white/5">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask your peer mentor..."
                className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-4 pl-5 pr-12 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSend();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-14 top-2 w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                title="Close Chat"
              >
                ✕
              </button>
              <button 
                onClick={handleSend}
                className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50"
                disabled={isLoading}
              >
                🚀
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all animate-bounce-slow relative group"
        >
          <div className="absolute -inset-2 bg-indigo-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          🤖
        </button>
      )}
    </div>
  );
};

export default AIChatBot;
