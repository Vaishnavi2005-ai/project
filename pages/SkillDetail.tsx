
import React, { useState, useRef, useMemo } from 'react';
import { Skill, ContentItem, Comment, User, ContentType } from '../types';
import { GoogleGenAI } from "@google/genai";

interface SkillDetailProps {
  skill: Skill;
  contents: ContentItem[];
  comments: Comment[];
  onAddComment: (comment: Comment) => void;
  onDeleteContent: (contentId: string) => void;
  onUpdateSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  currentUser: User;
  onBack: () => void;
  onToggleLearn: (skillName: string) => void;
  onToggleTeach: (skillName: string) => void;
  onGoToUpload: (skillId: string) => void;
  initialContentId?: string | null;
}

const SkillDetail: React.FC<SkillDetailProps> = ({ 
  skill, 
  contents, 
  comments, 
  onAddComment, 
  onDeleteContent, 
  onUpdateSkill, 
  onDeleteSkill,
  currentUser, 
  onBack,
  onToggleLearn,
  onToggleTeach,
  onGoToUpload,
  initialContentId
}) => {
  const [activeTab, setActiveTab] = useState<'all' | ContentType>('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    initialContentId ? contents.find(c => c.id === initialContentId) || null : null
  );

  // Sync selectedContent with initialContentId if it changes
  React.useEffect(() => {
    if (initialContentId) {
      const content = contents.find(c => c.id === initialContentId);
      if (content) setSelectedContent(content);
    }
  }, [initialContentId, contents]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Reset video state when content changes
  React.useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAiAnalysis(null);
  }, [selectedContent]);

  // Custom Video Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const filteredContents = activeTab === 'all' ? contents : contents.filter(c => c.type === activeTab);
  const videoContents = useMemo(() => contents.filter(c => c.type === 'video'), [contents]);

  const navigateVideo = (direction: 'next' | 'prev') => {
    if (!selectedContent || selectedContent.type !== 'video') return;
    const currentIndex = videoContents.findIndex(c => c.id === selectedContent.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < videoContents.length) {
      setSelectedContent(videoContents[nextIndex]);
    }
  };
  const canManageHub = currentUser.id === skill.createdBy || currentUser.isEditor;
  const isLearning = currentUser.learningSkills.includes(skill.name);
  const isTeaching = currentUser.teachingSkills.includes(skill.name);

  const prominentResource = useMemo(() => {
    return contents.find(c => c.id === skill.prominentResourceId);
  }, [contents, skill.prominentResourceId]);

  const analyzeVideoWithAI = async () => {
    if (!selectedContent || isAnalyzing) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      let parts: any[] = [{ text: `Analyze the following video content titled "${selectedContent.title}" in the context of the skill "${skill.name}". Description: ${selectedContent.description}. Provide a detailed breakdown of key concepts, technical takeaways, and actionable learning steps.` }];

      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          parts.push({
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg'
            }
          });
          parts[0].text += " Also analyze the visual information in this specific frame from the video.";
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts }],
        config: {
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 2000 }
        }
      });

      setAiAnalysis(response.text || "Analysis complete, but no findings generated.");
    } catch (error) {
      console.error("Analysis error:", error);
      setAiAnalysis("Peer AI encountered an error during analysis. Ensure your video is playing correctly.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePinResource = (contentId: string) => {
    onUpdateSkill({ ...skill, prominentResourceId: contentId });
  };

  const handleDelete = () => {
    if (selectedContent) {
      onDeleteContent(selectedContent.id);
      if (skill.prominentResourceId === selectedContent.id) {
        onUpdateSkill({ ...skill, prominentResourceId: undefined });
      }
      setSelectedContent(null);
      setShowDeleteConfirm(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    return url;
  };

  const getTypeStyle = (type: ContentType) => {
    switch (type) {
      case 'video': return { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', bar: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800/40', icon: '🎬', label: 'Video Class' };
      case 'pdf': return { color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30', bar: 'bg-rose-500', border: 'border-rose-200 dark:border-rose-800/40', icon: '📄', label: 'Study Material' };
      case 'gmeet': return { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', bar: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/40', icon: '📞', label: 'Live Meet' };
      case 'live': return { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', bar: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/40', icon: '📹', label: 'Live Stream' };
      case 'external': return { color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900/30', bar: 'bg-slate-500', border: 'border-slate-200 dark:border-slate-800/40', icon: '🔗', label: 'Resource' };
      default: return { color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', bar: 'bg-indigo-500', border: 'border-indigo-200', icon: '✨', label: 'Asset' };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 relative">
      <canvas ref={canvasRef} className="hidden" />
      
      <button onClick={onBack} className="group flex items-center space-x-3 text-indigo-600 dark:text-indigo-400 font-black hover:text-indigo-700 transition-colors uppercase tracking-[0.2em] text-[10px]">
        <span className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">←</span>
        <span>Back to Skill Hubs</span>
      </button>

      <div className="glass-card rounded-[3rem] p-10 shadow-xl border border-white dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-[10rem] pointer-events-none"></div>
        <div className="flex items-start md:items-center space-x-8 relative z-10">
          <div className="text-7xl p-8 bg-white/50 dark:bg-slate-800/50 rounded-[2.5rem] shadow-inner backdrop-blur-sm border border-white dark:border-white/10 shrink-0">
            {skill.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/20">{skill.category}</span>
              <span className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-white dark:border-white/10">Active Knowledge Hub</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">{skill.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">{skill.description}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 relative z-10">
          <div className="flex gap-3">
            <button 
              onClick={() => onToggleLearn(skill.name)}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                isLearning 
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-white dark:border-white/10'
              }`}
            >
              <span>{isLearning ? '✓' : '🎓'}</span>
              <span>{isLearning ? 'Learning' : 'Learn Skill'}</span>
            </button>
            <button 
              onClick={() => onToggleTeach(skill.name)}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                isTeaching 
                  ? 'bg-purple-600 text-white shadow-purple-500/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-white dark:border-white/10'
              }`}
            >
              <span>{isTeaching ? '✓' : '👨‍🏫'}</span>
              <span>{isTeaching ? 'Teaching' : 'Teach Skill'}</span>
            </button>
          </div>
          <button 
            onClick={() => window.open('https://meet.google.com/new', '_blank')}
            className="flex items-center justify-center space-x-4 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 group"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
            </span>
            <span>Host New Peer Session</span>
          </button>
          <button 
            onClick={() => onGoToUpload(skill.id)}
            className="flex items-center justify-center space-x-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl border border-white dark:border-white/10 transition-all hover:scale-105 active:scale-95 group"
          >
            <span>📤</span>
            <span>Upload New Resource</span>
          </button>
          
          {currentUser.id === skill.createdBy && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this entire skill hub and all its content?')) {
                  onDeleteSkill(skill.id);
                }
              }}
              className="flex items-center justify-center space-x-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl border border-red-100 dark:border-red-800/50 transition-all hover:bg-red-600 hover:text-white group"
            >
              <span>🗑️</span>
              <span>Delete Skill Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Reference / Pinned Resource */}
      {prominentResource && (
        <div className="animate-fadeIn">
          <div className="flex items-center space-x-3 mb-4 px-2">
             <span className="text-amber-500 text-xl">⭐</span>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Editor's Featured Resource</h3>
          </div>
          <div 
            onClick={() => { setSelectedContent(prominentResource); setAiAnalysis(null); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
            className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-[3rem] p-1 border border-white/40 dark:border-white/5 shadow-2xl cursor-pointer group hover:scale-[1.01] transition-all"
          >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-5xl shrink-0 shadow-2xl">
                {getTypeStyle(prominentResource.type).icon}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase rounded-lg tracking-widest shadow-lg shadow-amber-500/20">Essential Reading</span>
                  <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg tracking-widest ${getTypeStyle(prominentResource.type).bg} ${getTypeStyle(prominentResource.type).color}`}>
                    {getTypeStyle(prominentResource.type).label}
                  </span>
                </div>
                <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3 group-hover:text-indigo-600 transition-colors">
                  {prominentResource.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium line-clamp-2 text-lg">
                  {prominentResource.description}
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-xl">
                   →
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-hide px-2">
        {(['all', 'video', 'pdf', 'gmeet', 'live', 'external'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/30 scale-105' 
                : 'bg-white/40 dark:bg-slate-800/40 text-slate-400 border-transparent hover:border-indigo-100 dark:hover:border-slate-700'
            }`}
          >
            {tab === 'gmeet' ? '📞 Google Meet' : tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8">
          {selectedContent ? (
            <div className={`glass-card rounded-[3.5rem] overflow-hidden shadow-2xl border-white dark:border-white/5 animate-fadeIn transition-all duration-500 ${isCinemaMode ? 'fixed inset-0 z-[100] rounded-none bg-black' : ''}`}>
              <div className={`aspect-video bg-slate-900 relative ${isCinemaMode ? 'h-[80vh]' : ''}`}>
                {isCinemaMode && (
                  <button 
                    onClick={() => setIsCinemaMode(false)}
                    className="absolute top-8 right-8 z-[110] bg-white/20 hover:bg-white/40 backdrop-blur-md text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all"
                  >
                    &times;
                  </button>
                )}
                {selectedContent.type === 'video' ? (
                  <div 
                    className="relative w-full h-full group/video overflow-hidden"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => isPlaying && setShowControls(false)}
                  >
                    <video 
                      ref={videoRef}
                      key={selectedContent.id} 
                      src={selectedContent.url} 
                      className="w-full h-full object-contain cursor-pointer" 
                      crossOrigin="anonymous"
                      autoPlay={isCinemaMode}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={togglePlay}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    
                    {/* Custom Controls Overlay */}
                    <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 transition-all duration-300 flex flex-col gap-4 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                      {/* Seek Bar */}
                      <div className="flex items-center gap-4 group/seek">
                        <span className="text-[10px] font-black text-white/70 w-10">{formatTime(currentTime)}</span>
                        <input 
                          type="range"
                          min="0"
                          max={duration || 0}
                          step="0.1"
                          value={currentTime}
                          onChange={handleSeek}
                          className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
                        />
                        <span className="text-[10px] font-black text-white/70 w-10">{formatTime(duration)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          {/* Previous */}
                          <button 
                            onClick={() => navigateVideo('prev')}
                            disabled={!selectedContent || videoContents.findIndex(c => c.id === selectedContent.id) <= 0}
                            className="text-white/70 hover:text-white disabled:opacity-20 transition-all"
                            title="Previous Video"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                          </button>

                          {/* Play/Pause */}
                          <button 
                            onClick={togglePlay}
                            className="text-white hover:scale-110 transition-transform"
                          >
                            {isPlaying ? (
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            ) : (
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            )}
                          </button>

                          {/* Next */}
                          <button 
                            onClick={() => navigateVideo('next')}
                            disabled={!selectedContent || videoContents.findIndex(c => c.id === selectedContent.id) >= videoContents.length - 1}
                            className="text-white/70 hover:text-white disabled:opacity-20 transition-all"
                            title="Next Video"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                          </button>

                          {/* Volume */}
                          <div className="flex items-center gap-3 group/volume">
                            <button onClick={toggleMute} className="text-white/80 hover:text-white">
                              {isMuted || volume === 0 ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                              )}
                            </button>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="w-0 group-hover/volume:w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white transition-all overflow-hidden"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setIsCinemaMode(!isCinemaMode)}
                            className="text-white/70 hover:text-white transition-colors"
                            title="Cinema Mode"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedContent.type === 'external' && selectedContent.url.includes('youtube') ? (
                  <iframe src={getEmbedUrl(selectedContent.url)} className="w-full h-full border-0" allowFullScreen />
                ) : selectedContent.type === 'gmeet' || selectedContent.type === 'live' ? (
                  <div className={`w-full h-full flex flex-col items-center justify-center p-16 space-y-10 text-center bg-gradient-to-br ${selectedContent.type === 'gmeet' ? 'from-emerald-900 to-indigo-950' : 'from-amber-900 to-indigo-950'}`}>
                    <div className="relative">
                      <div className="absolute -inset-4 bg-white/10 rounded-[4rem] animate-pulse"></div>
                      <div className="w-44 h-44 rounded-[3.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-8xl shadow-2xl border border-white/20 relative">
                        {getTypeStyle(selectedContent.type).icon}
                      </div>
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-lg animate-bounce">
                        Live Now
                      </div>
                    </div>
                    
                    <div className="max-w-md space-y-4">
                      <h4 className="text-white text-3xl font-black tracking-tight uppercase">Ready to join your peers?</h4>
                      <p className="text-white/60 font-medium">Click below to enter the live session and start collaborative learning.</p>
                    </div>

                    <a 
                      href={selectedContent.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center space-x-6 bg-white hover:bg-emerald-50 text-indigo-900 px-12 py-5 rounded-[2rem] font-black uppercase text-sm transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20"
                    >
                      <span className="text-2xl">⚡</span>
                      <span>{selectedContent.type === 'gmeet' ? 'Join Google Meet' : 'Join Live Stream'}</span>
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-16 space-y-10 text-center bg-gradient-to-br from-indigo-950 to-slate-900">
                    <div className="w-40 h-40 rounded-[3rem] bg-white/10 flex items-center justify-center text-8xl shadow-2xl">
                      {getTypeStyle(selectedContent.type).icon}
                    </div>
                    <a href={selectedContent.url} target="_blank" rel="noopener noreferrer" className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-black uppercase text-sm">Open Resource</a>
                  </div>
                )}
              </div>
              
              <div className={`p-12 ${isCinemaMode ? 'bg-slate-900 text-white overflow-y-auto h-[20vh]' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center space-x-6">
                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getTypeStyle(selectedContent.type).bg} ${getTypeStyle(selectedContent.type).color}`}>
                      {getTypeStyle(selectedContent.type).label}
                    </div>
                    <h3 className={`text-4xl font-black tracking-tighter ${isCinemaMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{selectedContent.title}</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    {selectedContent.type === 'video' && (
                      <>
                        <button 
                          onClick={() => setIsCinemaMode(!isCinemaMode)}
                          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2 border border-white/20"
                        >
                          <span>{isCinemaMode ? '📺 Exit Cinema' : '🎬 Cinema Mode'}</span>
                        </button>
                        <button 
                          onClick={analyzeVideoWithAI}
                          disabled={isAnalyzing}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 flex items-center space-x-2"
                        >
                          {isAnalyzing ? (
                            <span className="flex items-center space-x-2">
                               <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               <span>AI Scanning...</span>
                            </span>
                          ) : (
                            <><span>✨ AI Analyze Video</span></>
                          )}
                        </button>
                      </>
                    )}

                    {canManageHub && (
                      <button 
                        onClick={() => handlePinResource(selectedContent.id)}
                        className={`p-3 rounded-xl transition-all border ${skill.prominentResourceId === selectedContent.id ? 'bg-amber-100 text-amber-600 border-amber-200 shadow-inner' : 'bg-white dark:bg-slate-800 text-slate-400 border-white dark:border-white/10 hover:border-amber-400 hover:text-amber-500'}`}
                        title={skill.prominentResourceId === selectedContent.id ? "Unpin this resource" : "Pin as Prominent Resource"}
                      >
                        {skill.prominentResourceId === selectedContent.id ? '⭐' : '☆'}
                      </button>
                    )}
                    
                    {(selectedContent.uploadedBy === currentUser.id || canManageHub) && (
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100 dark:bg-red-900/20 dark:border-red-900/30"
                        title="Delete this resource"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {aiAnalysis && (
                  <div className="mb-12 p-8 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-[2.5rem] animate-fadeIn">
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">✨</span>
                      <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">AI Deep Insights</h4>
                    </div>
                    <div className="prose prose-indigo dark:prose-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                    </div>
                  </div>
                )}
                
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-xl mb-12">{selectedContent.description}</p>
                
                <div className="flex items-center space-x-6 p-8 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem]">
                  <img src={`https://picsum.photos/seed/${selectedContent.uploadedBy}/200`} className="w-20 h-20 rounded-[1.75rem] border-4 border-white shadow-xl object-cover" alt="uploader" />
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-xl tracking-tight mb-1">{selectedContent.uploaderName}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Shared Asset • {new Date(selectedContent.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-fadeIn">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Knowledge Modules</h3>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-white/40 dark:border-white/10">{filteredContents.length} Modules Available</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {filteredContents.map(content => {
                  const style = getTypeStyle(content.type);
                  const videoId = content.url.includes('youtube.com') ? content.url.split('v=')[1]?.split('&')[0] : null;
                  
                  return (
                    <div 
                      key={content.id}
                      onClick={() => setSelectedContent(content)}
                      className="glass-card p-6 rounded-[3rem] border border-white/40 dark:border-white/5 hover:shadow-2xl hover:translate-y-[-8px] transition-all cursor-pointer group flex flex-col h-full"
                    >
                      <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-[2rem] mb-6 overflow-hidden relative flex items-center justify-center border border-white/60 dark:border-white/10 shadow-inner">
                        {content.type === 'video' ? (
                          <video src={content.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                        ) : content.type === 'external' && videoId ? (
                          <img 
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                            referrerPolicy="no-referrer"
                            alt={content.title}
                          />
                        ) : (
                          <div className="text-7xl group-hover:scale-110 transition-transform duration-500">{style.icon}</div>
                        )}
                        
                        <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border ${style.bg} ${style.color} border-white/20`}>
                          {content.type}
                        </div>

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xl border border-white/30 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                            ▶
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 px-2">
                        <h4 className="font-black text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2 tracking-tight mb-2">{content.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 font-medium mb-6">{content.description}</p>
                      </div>

                      <div className="pt-6 border-t border-white/40 dark:border-white/10 flex items-center justify-between px-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                            {content.uploaderName.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{content.uploaderName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(content.uploadedBy === currentUser.id || canManageHub) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContent(content);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors border border-red-100 dark:border-red-900/30"
                              title="Delete resource"
                            >
                              🗑️
                            </button>
                          )}
                          {content.type === 'external' && (
                            <a 
                              href={content.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                              title="Open in new tab"
                            >
                              🔗
                            </a>
                          )}
                          <span className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Explore →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-32">
          <div className="flex items-center justify-between px-6 mb-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Mastery Path</h3>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{filteredContents.length} MODULES</span>
          </div>
          <div className="space-y-4">
            {filteredContents.map(content => {
              const style = getTypeStyle(content.type);
              const isSelected = selectedContent?.id === content.id;
              const isPinned = skill.prominentResourceId === content.id;
              const videoId = content.url.includes('youtube.com') ? content.url.split('v=')[1]?.split('&')[0] : null;

              return (
                <div
                  key={content.id}
                  onClick={() => { setSelectedContent(content); setAiAnalysis(null); }}
                  className={`p-5 rounded-[2rem] cursor-pointer transition-all border flex items-center space-x-5 relative overflow-hidden group ${
                    isSelected ? 'bg-indigo-600 text-white border-transparent shadow-2xl shadow-indigo-500/40 scale-[1.03]' : 'bg-white/60 dark:bg-slate-800/60 border-white dark:border-white/5'
                  }`}
                >
                  <div className={`w-20 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative ${isSelected ? 'bg-white/20' : style.bg}`}>
                    {content.type === 'video' ? (
                      <video src={content.url} className="w-full h-full object-cover opacity-60" />
                    ) : content.type === 'external' && videoId ? (
                      <img 
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                        className="w-full h-full object-cover opacity-60" 
                        referrerPolicy="no-referrer"
                        alt={content.title}
                      />
                    ) : (
                      <span className="text-2xl">{style.icon}</span>
                    )}
                    {isSelected && <div className="absolute inset-0 bg-indigo-600/20"></div>}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                       {isPinned && <span className="text-amber-400 text-xs">⭐</span>}
                       <h4 className="font-black text-sm truncate tracking-tight">{content.title}</h4>
                    </div>
                    <p className={`text-[9px] uppercase font-black tracking-widest mt-1 opacity-60 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>Peer • {content.uploaderName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-6">
          <div className="glass-card rounded-[3rem] w-full max-w-md p-10 text-center animate-popIn border-white/40 shadow-2xl">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Delete Asset?</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">This action will permanently remove <span className="text-slate-900 dark:text-slate-200">"{selectedContent?.title}"</span> from the network hubs. It cannot be undone.</p>
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest border border-slate-200 dark:border-white/10"
              >
                Discard
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-8 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/30"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillDetail;
