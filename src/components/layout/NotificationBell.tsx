'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  status: 'Unread' | 'Read';
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: any) => n.status === 'Unread').length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const connectSSE = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection established');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications(prev => [
            {
              id: `NOTIF-${Date.now()}`,
              title: data.title,
              message: data.message,
              type: data.type,
              status: 'Unread',
              createdAt: data.createdAt
            },
            ...prev.slice(0, 19)
          ]);
          setUnreadCount(prev => prev + 1);
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        
        // Retry connection after 5 seconds instead of giving up
        setTimeout(() => {
          console.log('Attempting to reconnect SSE...');
          connectSSE();
        }, 5000);
      };
    };

    connectSSE();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id } : { markAll: true })
      });
      
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <Check size={14} className="text-emerald-400" />;
      case 'WARNING': return <AlertCircle size={14} className="text-amber-400" />;
      case 'ERROR': return <AlertCircle size={14} className="text-rose-400" />;
      default: return <Clock size={14} className="text-brand-gold" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-4 h-4 bg-brand-gold text-brand-obsidian text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-obsidian"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-96 bg-brand-obsidian/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Communications</h3>
                <p className="text-[10px] uppercase tracking-widest text-white/40">System Intel</p>
              </div>
              <button 
                onClick={() => markAsRead()}
                className="text-[10px] uppercase tracking-widest text-brand-gold hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={20} className="text-white/20" />
                  </div>
                  <p className="text-sm text-white/40">No active signals.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors group relative ${notif.status === 'Unread' ? 'bg-brand-gold/5' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center bg-white/5`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-bold truncate ${notif.status === 'Unread' ? 'text-brand-gold' : 'text-white/80'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-white/20 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                    {notif.status === 'Unread' && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-obsidian"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white/5 text-center">
              <button className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                View Command Center History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
