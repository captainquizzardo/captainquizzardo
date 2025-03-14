'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { LeaderboardEntry } from '@/types';

type TimeFrame = 'all' | 'monthly' | 'weekly' | 'daily';
type Category = 'overall' | 'paid' | 'free';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all');
  const [category, setCategory] = useState<Category>('overall');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError('');

        // Create a date filter based on timeFrame
        const now = new Date();
        let startDate = new Date();
        switch (timeFrame) {
          case 'daily':
            startDate.setDate(now.getDate() - 1);
            break;
          case 'weekly':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'monthly':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'all':
            startDate = new Date(0); // Beginning of time
            break;
        }

        // Query Firestore for leaderboard data
        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(
          leaderboardRef,
          // Add filters based on category and timeFrame
          orderBy('score', 'desc'),
          limit(100)
        );

        const querySnapshot = await getDocs(q);
        const entries: LeaderboardEntry[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as LeaderboardEntry;
          entries.push({
            ...data,
            id: doc.id,
          });

          // Set user's rank if found
          if (data.userId === user?.uid) {
            setUserRank(data);
          }
        });

        setLeaderboard(entries);
      } catch (error) {
        setError('Error fetching leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFrame, category, user]);

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Leaderboard</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="space-x-2">
              {(['all', 'monthly', 'weekly', 'daily'] as TimeFrame[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFrame(t)}
                  className={`px-4 py-2 rounded-full ${
                    timeFrame === t
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-x-2">
              {(['overall', 'paid', 'free'] as Category[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full ${
                    category === c
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white">Loading leaderboard...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              {/* Top 3 Players */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {leaderboard.slice(0, 3).map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`relative bg-white/10 rounded-xl p-6 text-center transform hover:scale-105 transition-transform ${
                      index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'
                    }`}
                  >
                    <div
                      className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0
                          ? 'bg-yellow-400'
                          : index === 1
                          ? 'bg-gray-300'
                          : 'bg-yellow-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="mt-4">
                      <div className="text-xl font-bold text-white mb-2">
                        {entry.userName}
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-white/80">
                        Quizzes Won: {entry.quizzesWon || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rest of the Leaderboard */}
              <div className="space-y-4">
                {leaderboard.slice(3).map((entry, index) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-white/80 w-8">{index + 4}</div>
                      <div>
                        <div className="font-medium text-white">
                          {entry.userName}
                        </div>
                        <div className="text-white/80 text-sm">
                          Quizzes Won: {entry.quizzesWon || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* User's Position */}
              {userRank && userRank.rank > 100 && (
                <div className="mt-8 bg-white/10 rounded-lg p-4">
                  <div className="text-center text-white">
                    <div className="text-lg font-medium">Your Position</div>
                    <div className="text-3xl font-bold">
                      {getOrdinal(userRank.rank)}
                    </div>
                    <div className="text-white/80">
                      Score: {userRank.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
