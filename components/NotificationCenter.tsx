
import React from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick: (notification: AppNotification) => void;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = [],
  onMarkAsRead,
  onClearAll,
  onNotificationClick,
  onClose
}) => {
  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  return (
    <div className="absolute top-full right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden z-[200] animate-popIn">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Notifications</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unreadCount} Unread</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={onClearAll}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
          >
            Clear All
          </button>
        )}
        <button 
          onClick={onClose}
          className="ml-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
                className={`p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${!notification.isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
              >
                {!notification.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="text-xl">
                    {notification.type === 'message' && '💬'}
                    {notification.type === 'session' && '📅'}
                    {notification.type === 'upload' && '📤'}
                    {notification.type === 'skill' && '🌟'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white mb-1">{notification.title}</p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{notification.message}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                      {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
