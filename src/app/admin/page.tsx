'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Quiz, User } from '@/types';
import Link from 'next/link';
import { UserIcon } from '@heroicons/react/24/outline';

type Tab = 'quizzes' | 'users' | 'payments' | 'settings';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (activeTab === 'quizzes') {
          const quizSnapshot = await getDocs(collection(db, 'quizzes'));
          const quizData: Quiz[] = [];
          quizSnapshot.forEach((doc) => {
            quizData.push({ id: doc.id, ...doc.data() } as Quiz);
          });
          setQuizzes(quizData);
        } else if (activeTab === 'users') {
          const userSnapshot = await getDocs(collection(db, 'users'));
          const userData: User[] = [];
          userSnapshot.forEach((doc) => {
            userData.push({ id: doc.id, ...doc.data() } as User);
          });
          setUsers(userData);
        }
      } catch (error) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
    } catch (error) {
      setError('Error deleting quiz');
    }
  };

  const handleToggleQuizStatus = async (quiz: Quiz) => {
    try {
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        isActive: !quiz.isActive
      });
      setQuizzes(quizzes.map(q => 
        q.id === quiz.id ? { ...q, isActive: !q.isActive } : q
      ));
    } catch (error) {
      setError('Error updating quiz status');
    }
  };

  const AdminSettings = () => {
    const [settings, setSettings] = useState({
      paymentApiKey: '',
      quizDefaults: {
        timePerQuestion: 30,
        shuffleQuestions: true,
        allowRetakes: false,
        showLeaderboard: true
      },
      uiSettings: {
        primaryColor: '#4F46E5',
        darkMode: true,
        showTimer: true
      },
      securitySettings: {
        maxAttemptsPerUser: 1,
        ipRestriction: true,
        tabSwitchingAllowed: false
      }
    });

    const handleSave = async () => {
      try {
        await updateDoc(doc(db, 'admin', 'settings'), settings);
        setError('');
      } catch (error) {
        setError('Error saving settings');
      }
    };

    return (
      <div className="space-y-8">
        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quiz Default Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/80">Time per Question (seconds)</label>
              <input
                type="number"
                value={settings.quizDefaults.timePerQuestion}
                onChange={(e) => setSettings({
                  ...settings,
                  quizDefaults: {
                    ...settings.quizDefaults,
                    timePerQuestion: parseInt(e.target.value)
                  }
                })}
                className="mt-1 w-full bg-white/10 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.quizDefaults.shuffleQuestions}
                onChange={(e) => setSettings({
                  ...settings,
                  quizDefaults: {
                    ...settings.quizDefaults,
                    shuffleQuestions: e.target.checked
                  }
                })}
              />
              <label className="text-white/80">Shuffle Questions</label>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/80">Max Attempts per User</label>
              <input
                type="number"
                value={settings.securitySettings.maxAttemptsPerUser}
                onChange={(e) => setSettings({
                  ...settings,
                  securitySettings: {
                    ...settings.securitySettings,
                    maxAttemptsPerUser: parseInt(e.target.value)
                  }
                })}
                className="mt-1 w-full bg-white/10 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.securitySettings.ipRestriction}
                onChange={(e) => setSettings({
                  ...settings,
                  securitySettings: {
                    ...settings.securitySettings,
                    ipRestriction: e.target.checked
                  }
                })}
              />
              <label className="text-white/80">Enable IP Restriction</label>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Payment Gateway</h2>
          <div>
            <label className="text-white/80">Payment API Key</label>
            <input
              type="password"
              value={settings.paymentApiKey}
              onChange={(e) => setSettings({
                ...settings,
                paymentApiKey: e.target.value
              })}
              className="mt-1 w-full bg-white/10 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
        >
          Save All Settings
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          {(['quizzes', 'users', 'payments', 'settings'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full text-white font-medium ${
                activeTab === tab
                  ? 'bg-white/20 backdrop-blur-lg'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <>
              {activeTab === 'quizzes' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Manage Quizzes</h2>
                    <Link
                      href="/admin/quiz/new"
                      className="bg-white text-indigo-600 px-6 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors"
                    >
                      Create New Quiz
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-white">
                            {quiz.title}
                          </h3>
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/quiz/${quiz.id}`}
                              className="text-white hover:text-indigo-200"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-white/80">
                          <p>Type: {quiz.type}</p>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <UserIcon className="w-4 h-4 mr-1" />
                            {quiz.maxParticipants ? `${quiz.maxParticipants} max participants` : 'Unlimited participants'}
                          </div>
                          <p>
                            Status:{' '}
                            <span
                              className={`${
                                quiz.isActive ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {quiz.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleQuizStatus(quiz)}
                          className={`mt-4 w-full py-2 rounded-full text-sm font-medium ${
                            quiz.isActive
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          }`}
                        >
                          {quiz.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Manage Users</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Mobile</th>
                          <th className="text-left py-3 px-4">Location</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-3 px-4">{user.name}</td>
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">{user.mobile}</td>
                            <td className="py-3 px-4">
                              {user.district}, {user.state}
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                href={`/admin/user/${user.id}`}
                                className="text-indigo-300 hover:text-indigo-200 mr-4"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Payment History</h2>
                  {/* Payment history table will be implemented here */}
                  <div className="text-white/80">Payment management coming soon...</div>
                </div>
              )}

              {activeTab === 'settings' && (
                <AdminSettings />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
