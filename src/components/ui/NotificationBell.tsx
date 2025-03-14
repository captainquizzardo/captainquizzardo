'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Link from 'next/link';

interface Notification {
  id: string;
  userId: string;
  type: 'quiz_reminder' | 'quiz_result' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = [];
      snapshot.forEach((doc) => {
        newNotifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        } as Notification);
      });
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'quiz_reminder':
        return '🎯';
      case 'quiz_result':
        return '🏆';
      case 'payment':
        return '💰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {notifications.length > 0 && (
                <Link
                  href="/notifications"
                  className="text-sm text-white/80 hover:text-white"
                  onClick={() => setShowDropdown(false)}
                >
                  View All
                </Link>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-white/60">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link || '/notifications'}
                    onClick={() => setShowDropdown(false)}
                    className="block p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-white/60 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
