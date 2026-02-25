
import React, { useState, useEffect, useRef } from 'react';
import { loadData, saveData } from './store';
import { User, Skill, ContentItem, Comment, UserSettings, AppNotification } from './types';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UploadContent from './pages/UploadContent';
import SkillDetail from './pages/SkillDetail';
import Network from './pages/Network';
import DataHub from './pages/DataHub';
import UserMatching from './pages/UserMatching';
import AIChatBot from './components/AIChatBot';
import NotificationCenter from './components/NotificationCenter';

const App: React.FC = () => {
  const [data, setData] = useState(loadData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [uploadPreSelectId, setUploadPreSelectId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const onlineUsersRef = useRef<User[]>([]);

  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  useEffect(() => {
    if (!data.currentUser) {
      setOnlineUsers([]);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'USER_JOINED', user: data.currentUser }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'PRESENCE_UPDATE') {
          const newUsers = message.users as User[];
          
          // Only notify if we already have an initial list (to avoid spam on connect)
          if (onlineUsersRef.current.length > 0) {
            newUsers.forEach(u => {
              if (u.id !== data.currentUser?.id && !onlineUsersRef.current.some(existing => existing.id === u.id)) {
                addNotification({
                  type: 'message',
                  title: 'Peer Connected',
                  message: `${u.name} has joined the peer network.`,
                });
              }
            });
          }

          setOnlineUsers(newUsers);
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [data.currentUser?.id]);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    if (data.currentUser?.settings?.theme) {
      const body = document.body;
      body.classList.remove('dark-theme', 'monochrome-theme');
      if (data.currentUser.settings.theme === 'dark') body.classList.add('dark-theme');
      if (data.currentUser.settings.theme === 'monochrome') body.classList.add('monochrome-theme');
    }
  }, [data.currentUser?.settings?.theme]);

  const handleLogin = (user: User) => {
    const exists = data.users.find(u => u.email === user.email);
    if (!exists) {
      setData({ ...data, users: [...data.users, user], currentUser: user });
    } else {
      setData({ ...data, currentUser: user });
    }
  };

  const handleLogout = () => {
    setData({ ...data, currentUser: null });
    setActiveTab('dashboard');
    setViewingUserId(null);
    setSelectedSkillId(null);
    setSearchQuery('');
    document.body.classList.remove('dark-theme', 'monochrome-theme');
  };

  const updateProfile = (updatedUser: User) => {
    const updatedUsers = data.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setData({ ...data, users: updatedUsers, currentUser: updatedUser });
  };

  const updateSettings = (settings: UserSettings) => {
    if (data.currentUser) {
      const updatedUser = { ...data.currentUser, settings };
      updateProfile(updatedUser);
    }
  };

  const addSkill = (newSkill: Skill) => {
    setData({ ...data, skills: [...data.skills, newSkill] });
    addNotification({
      type: 'skill',
      title: 'New Skill Hub Launched',
      message: `The "${newSkill.name}" hub is now active!`,
      link: { tab: 'skills', skillId: newSkill.id }
    });
  };

  const deleteSkill = (skillId: string) => {
    const skill = data.skills.find(s => s.id === skillId);
    const updatedSkills = data.skills.filter(s => s.id !== skillId);
    const updatedContents = data.contents.filter(c => c.skillId !== skillId);
    const contentIds = data.contents.filter(c => c.skillId === skillId).map(c => c.id);
    const updatedComments = data.comments.filter(c => !contentIds.includes(c.contentId));
    
    setData({ ...data, skills: updatedSkills, contents: updatedContents, comments: updatedComments });
    setSelectedSkillId(null);
    
    addNotification({
      type: 'skill',
      title: 'Hub Removed',
      message: `The "${skill?.name || 'Skill'}" hub has been deleted.`,
    });
  };

  const handleUpdateSkill = (updatedSkill: Skill) => {
    const updatedSkills = data.skills.map(s => s.id === updatedSkill.id ? updatedSkill : s);
    setData({ ...data, skills: updatedSkills });
  };

  const addContent = (content: ContentItem) => {
    setData({ ...data, contents: [...data.contents, content] });
    setActiveTab('skills');
    setSelectedSkillId(content.skillId);
    setSelectedContentId(content.id);
    
    addNotification({
      type: 'upload',
      title: 'New Content Uploaded',
      message: `New ${content.type} "${content.title}" is now available.`,
      link: { tab: 'skills', skillId: content.skillId, contentId: content.id }
    });
  };

  const deleteContent = (contentId: string) => {
    const updatedContents = data.contents.filter(c => c.id !== contentId);
    const updatedComments = data.comments.filter(c => c.contentId !== contentId);
    setData({ ...data, contents: updatedContents, comments: updatedComments });
  };

  const addComment = (comment: Comment) => {
    setData({ ...data, comments: [...data.comments, comment] });
  };

  const toggleLearnSkill = (skillName: string) => {
    if (!data.currentUser) return;
    const isLearning = data.currentUser.learningSkills.includes(skillName);
    const updatedLearning = isLearning 
      ? data.currentUser.learningSkills.filter(s => s !== skillName)
      : [...data.currentUser.learningSkills, skillName];
    
    const updatedUser = { ...data.currentUser, learningSkills: updatedLearning };
    updateProfile(updatedUser);
  };

  const toggleTeachSkill = (skillName: string) => {
    if (!data.currentUser) return;
    const isTeaching = data.currentUser.teachingSkills.includes(skillName);
    const updatedTeaching = isTeaching 
      ? data.currentUser.teachingSkills.filter(s => s !== skillName)
      : [...data.currentUser.teachingSkills, skillName];
    
    const updatedUser = { ...data.currentUser, teachingSkills: updatedTeaching };
    updateProfile(updatedUser);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'userId' | 'timestamp' | 'isRead'>) => {
    if (!data.currentUser) return;
    const newNotif: AppNotification = {
      ...notif,
      id: 'n' + Date.now(),
      userId: data.currentUser.id,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setData(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications] }));
  };

  const markNotificationAsRead = (id: string) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
  };

  const clearNotifications = () => {
    setData(prev => ({ ...prev, notifications: [] }));
  };

  const handleNotificationClick = (n: AppNotification) => {
    markNotificationAsRead(n.id);
    if (n.link) {
      if (n.link.tab) setActiveTab(n.link.tab);
      if (n.link.skillId) setSelectedSkillId(n.link.skillId);
      if (n.link.contentId) setSelectedContentId(n.link.contentId);
    }
    setShowNotifications(false);
  };

  const handleBulkUpdate = (newData: any) => {
    setData({ ...data, ...newData });
  };

  if (!data.currentUser) {
    return <Auth onLogin={handleLogin} users={data.users} />;
  }

  const renderContent = () => {
    // Priority 1: Skill Detail
    if (selectedSkillId) {
      const skill = data.skills.find(s => s.id === selectedSkillId);
      if (skill) {
        return (
          <SkillDetail
            skill={skill}
            contents={data.contents.filter(c => c.skillId === skill.id)}
            comments={data.comments}
            onAddComment={addComment}
            onDeleteContent={deleteContent}
            onUpdateSkill={handleUpdateSkill}
            onDeleteSkill={deleteSkill}
            currentUser={data.currentUser}
            onBack={() => {
              setSelectedSkillId(null);
              setSelectedContentId(null);
            }}
            onToggleLearn={toggleLearnSkill}
            onToggleTeach={toggleTeachSkill}
            onGoToUpload={(skillId) => {
              setUploadPreSelectId(skillId);
              setActiveTab('upload');
              setSelectedSkillId(null);
            }}
            initialContentId={selectedContentId}
          />
        );
      }
    }

    // Priority 2: Viewing another Peer Profile
    if (viewingUserId) {
      const userToView = data.users.find(u => u.id === viewingUserId) || onlineUsers.find(u => u.id === viewingUserId);
      if (userToView) {
        return (
          <Profile
            user={userToView}
            currentUser={data.currentUser}
            onUpdateProfile={updateProfile}
            onBack={() => {
              setViewingUserId(null);
              setActiveTab('network');
            }}
            onViewContent={(skillId, contentId) => {
              setSelectedSkillId(skillId);
              setSelectedContentId(contentId);
              setViewingUserId(null);
            }}
          />
        );
      }
    }

    // Default: Tabs
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            currentUser={data.currentUser}
            users={data.users}
            skills={data.skills}
            contents={data.contents}
            onSelectSkill={(id, contentId) => {
              if (id === 'matching') {
                setActiveTab('matching');
                setSelectedSkillId(null);
                setSelectedContentId(null);
              } else {
                setSelectedSkillId(id);
                if (contentId) setSelectedContentId(contentId);
              }
            }}
            searchQuery={searchQuery}
            onlineUsers={onlineUsers}
          />
        );
      case 'skills':
        return (
          <Skills
            skills={data.skills}
            onAddSkill={addSkill}
            onSelectSkill={(id) => setSelectedSkillId(id)}
            currentUser={data.currentUser}
            searchQuery={searchQuery}
            onToggleLearn={toggleLearnSkill}
            onToggleTeach={toggleTeachSkill}
            onGoToUpload={(skillId) => {
              setUploadPreSelectId(skillId);
              setActiveTab('upload');
            }}
          />
        );
      case 'network':
        return (
          <Network 
            users={data.users} 
            searchQuery={searchQuery} 
            onViewProfile={(id) => setViewingUserId(id)}
            onlineUsers={onlineUsers}
          />
        );
      case 'matching':
        return (
          <UserMatching 
            currentUser={data.currentUser} 
            users={data.users} 
            skills={data.skills} 
            contents={data.contents}
            onViewProfile={(id) => setViewingUserId(id)}
            onViewContent={(skillId, contentId) => {
              setSelectedSkillId(skillId);
              setSelectedContentId(contentId);
              setActiveTab('skills');
            }}
            onAddNotification={addNotification}
            onlineUsers={onlineUsers}
          />
        );
      case 'profile':
        return (
          <Profile
            user={data.currentUser}
            currentUser={data.currentUser}
            onUpdateProfile={updateProfile}
            onViewContent={(skillId, contentId) => {
              setSelectedSkillId(skillId);
              setSelectedContentId(contentId);
              setActiveTab('skills');
            }}
          />
        );
      case 'settings':
        return (
          <Settings
            user={data.currentUser}
            onUpdateSettings={updateSettings}
          />
        );
      case 'data-hub':
        return <DataHub data={data} onUpdate={handleBulkUpdate} />;
      case 'upload':
        return (
          <UploadContent
            skills={data.skills}
            onUpload={(content) => {
              addContent(content);
              setUploadPreSelectId(null);
            }}
            currentUser={data.currentUser}
            preSelectedSkillId={uploadPreSelectId}
          />
        );
      default:
        return <Dashboard currentUser={data.currentUser} users={data.users} skills={data.skills} contents={data.contents} onSelectSkill={() => {}} searchQuery={searchQuery} />;
    }
  };

  return (
    <Layout
      activeTab={selectedSkillId ? 'skills' : (viewingUserId ? 'network' : activeTab)}
      onTabChange={(tab) => {
        setSelectedSkillId(null);
        setSelectedContentId(null);
        setViewingUserId(null);
        setActiveTab(tab);
        setSearchQuery('');
      }}
      currentUser={data.currentUser}
      onLogout={handleLogout}
      selectedSkillId={selectedSkillId}
      searchQuery={searchQuery}
      onSearchChange={(query) => {
        setSearchQuery(query);
      }}
      unreadNotifications={(data.notifications || []).filter(n => !n.isRead).length}
      onToggleNotifications={() => setShowNotifications(!showNotifications)}
      onlineUsers={onlineUsers}
      isSubViewActive={!!selectedSkillId || !!viewingUserId}
      onCloseSubView={() => {
        setSelectedSkillId(null);
        setSelectedContentId(null);
        setViewingUserId(null);
      }}
    >
      {showNotifications && (
        <NotificationCenter 
          notifications={data.notifications || []}
          onMarkAsRead={markNotificationAsRead}
          onClearAll={clearNotifications}
          onNotificationClick={handleNotificationClick}
          onClose={() => setShowNotifications(false)}
        />
      )}
      {renderContent()}
      {data.currentUser && (
        <AIChatBot 
          currentUser={data.currentUser} 
          allSkills={data.skills}
          allUsers={data.users}
          allContents={data.contents}
        />
      )}
    </Layout>
  );
};

export default App;
