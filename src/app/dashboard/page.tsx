'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import RouteGuard from '@/components/auth/RouteGuard';
import { db } from '@/app/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import { Quiz, UserStats } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<Quiz[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    rank: 0,
    quizzesPlayed: 0,
    totalWinnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch upcoming quizzes
        const quizRef = collection(db, 'quizzes');
        const now = new Date();
        const quizQuery = query(
          quizRef,
          where('startTime', '>', now),
          where('isActive', '==', true),
          orderBy('startTime', 'asc'),
          limit(6)
        );
        
        const quizSnapshot = await getDocs(quizQuery);
        const quizzes: Quiz[] = [];
        quizSnapshot.forEach((doc) => {
          quizzes.push({ id: doc.id, ...doc.data() } as Quiz);
        });
        setUpcomingQuizzes(quizzes);

        // Fetch user stats if user exists
        if (user) {
          const statsRef = collection(db, 'userStats');
          const statsQuery = query(statsRef, where('userId', '==', user.id));
          const statsSnapshot = await getDocs(statsQuery);
          
          if (!statsSnapshot.empty) {
            const stats = statsSnapshot.docs[0].data();
            setUserStats({
              rank: stats.rank || 0,
              quizzesPlayed: stats.quizzesPlayed || 0,
              totalWinnings: stats.totalWinnings || 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const formatTimeLeft = (startTime: Date) => {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name || 'Quizzer'}!
            </h1>
            <p className="text-white/80">
              Ready to test your knowledge and win exciting prizes?
            </p>
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="inline-block mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                Go to Admin Dashboard
              </Link>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Your Rank</h3>
              <p className="text-3xl font-bold text-white">
                #{userStats.rank > 0 ? userStats.rank.toLocaleString() : '---'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Quizzes Played</h3>
              <p className="text-3xl font-bold text-white">
                {userStats.quizzesPlayed.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Total Winnings</h3>
              <p className="text-3xl font-bold text-white">
                ₹{userStats.totalWinnings.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Upcoming Quizzes */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Upcoming Quizzes</h2>
              <Link
                href="/quizzes"
                className="text-white/80 hover:text-white transition-colors"
              >
                View All
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : upcomingQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {quiz.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        quiz.type === 'paid' 
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {quiz.type === 'paid' ? 'Paid' : 'Free'}
                      </span>
                    </div>
                    <p className="text-white/80 mb-3 line-clamp-2">{quiz.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Time Left:</span>
                        <span className="text-white font-medium">
                          {formatTimeLeft(quiz.startTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Prize Pool:</span>
                        <span className="text-white font-medium">
                          ₹{(quiz.prizeMoney || []).reduce((a, b) => a + b, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Entry Fee:</span>
                        <span className="text-white font-medium">
                          {quiz.entryFee ? `₹${quiz.entryFee}` : 'Free'}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/quiz/${quiz.id}`}
                      className="mt-4 block w-full text-center py-2 px-4 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                    >
                      {quiz.type === 'paid' ? 'Join Now' : 'Play Free'}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/80 mb-4">No upcoming quizzes at the moment.</p>
                <Link
                  href="/quiz/practice"
                  className="inline-block px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                >
                  Try Practice Quizzes
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/quiz/practice"
              className="group bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/90">
                Practice Quizzes
              </h3>
              <p className="text-white/80 group-hover:text-white/70">
                Sharpen your skills with our free practice quizzes
              </p>
            </Link>
            <Link
              href="/leaderboard"
              className="group bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/90">
                Leaderboard
              </h3>
              <p className="text-white/80 group-hover:text-white/70">
                See where you stand among other players
              </p>
            </Link>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
