'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
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

type Filter = 'all' | 'unread' | 'quiz' | 'payment' | 'system';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchNotifications();
  }, [user, filter]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const notificationsRef = collection(db, 'notifications');
      let q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      if (filter === 'unread') {
        q = query(q, where('read', '==', false));
      } else if (filter === 'quiz') {
        q = query(
          q,
          where('type', 'in', ['quiz_reminder', 'quiz_result'])
        );
      } else if (filter === 'payment') {
        q = query(q, where('type', '==', 'payment'));
      } else if (filter === 'system') {
        q = query(q, where('type', '==', 'system'));
      }

      const snapshot = await getDocs(q);
      const notificationData: Notification[] = [];
      snapshot.forEach((doc) => {
        notificationData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        } as Notification);
      });

      setNotifications(notificationData);
    } catch (error) {
      setError('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      setError('Error marking notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((notification) => {
          batch.update(doc(db, 'notifications', notification.id), {
            read: true,
          });
        });
      await batch.commit();

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      setError('Error marking all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      setError('Error deleting notification');
    }
  };

  const deleteSelected = async () => {
    if (!user || selectedNotifications.size === 0) return;

    try {
      const batch = writeBatch(db);
      selectedNotifications.forEach((id) => {
        batch.delete(doc(db, 'notifications', id));
      });
      await batch.commit();

      setNotifications((prev) =>
        prev.filter((notification) => !selectedNotifications.has(notification.id))
      );
      setSelectedNotifications(new Set());
    } catch (error) {
      setError('Error deleting notifications');
    }
  };

  const toggleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(notifications.map((notification) => notification.id))
      );
    }
  };

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            <div className="flex items-center space-x-4">
              {selectedNotifications.size > 0 ? (
                <>
                  <button
                    onClick={deleteSelected}
                    className="px-4 py-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    Delete Selected ({selectedNotifications.size})
                  </button>
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    Mark All as Read
                  </button>
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    Select All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-6">
            {(['all', 'unread', 'quiz', 'payment', 'system'] as Filter[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    filter === f
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              )
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-white py-8">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              No notifications found
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative bg-white/5 rounded-lg p-4 transition-colors ${
                    notification.read ? 'opacity-75' : ''
                  } ${
                    selectedNotifications.has(notification.id)
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => toggleSelectNotification(notification.id)}
                      className="mt-1"
                    />
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            {notification.title}
                          </h3>
                          <p className="text-white/80 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <div className="text-sm text-white/60">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-4">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="text-indigo-300 hover:text-indigo-200 text-sm"
                          >
                            View Details
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-white/60 hover:text-white text-sm"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
