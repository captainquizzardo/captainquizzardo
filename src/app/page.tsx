'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import CountdownTimer from '../components/ui/CountdownTimer';
import Image from "next/image";
import { getDocs, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { Quiz } from '@/types';
import { UserIcon } from '@heroicons/react/24/outline';

interface Winner {
  name: string;
  prize: number;
  timestamp: Date;
}

export default function Home() {
  const { user } = useAuth();
  const [nextQuiz, setNextQuiz] = useState<{ time: Date; prize: number } | null>(null);
  const [topQuizzes, setTopQuizzes] = useState<Quiz[]>([]);
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Fetch next quiz
        const nextQuizSnapshot = await getDocs(
          query(collection(db, 'quizzes'), 
          where('startTime', '>', new Date()),
          orderBy('startTime', 'asc'),
          limit(1))
        );
        
        if (!nextQuizSnapshot.empty) {
          const quizData = nextQuizSnapshot.docs[0].data();
          setNextQuiz({
            time: quizData.startTime.toDate(),
            prize: (quizData.prizeMoney || []).reduce((a: number, b: number) => a + b, 0)
          });
        }

        // Fetch top quizzes
        const topQuizzesSnapshot = await getDocs(
          query(collection(db, 'quizzes'),
          where('isActive', '==', true),
          orderBy('prizeMoney', 'desc'),
          limit(3))
        );
        
        const quizzes = topQuizzesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          endTime: doc.data().endTime?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Quiz));
        setTopQuizzes(quizzes);

        // Fetch recent winners
        const winnersSnapshot = await getDocs(
          query(collection(db, 'winners'),
          orderBy('timestamp', 'desc'),
          limit(5))
        );
        
        const winners = winnersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            name: data.name || 'Anonymous',
            prize: data.prize || 0,
            timestamp: data.timestamp?.toDate() || new Date()
          } as Winner;
        });
        setRecentWinners(winners);
      } catch (error) {
        console.error('Error fetching quiz data:', error);
      }
    };

    fetchQuizData();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6 animate-fade-in">
            Welcome to Captain Quizzardo
          </h1>
          <p className="text-xl mb-8">
            Test your knowledge, compete with others, and win amazing prizes!
          </p>
          
          {/* Next Quiz Countdown */}
          {nextQuiz && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Next Paid Quiz</h2>
              <div className="text-4xl font-bold mb-4">
                Prize Pool: ₹{nextQuiz.prize.toLocaleString()}
              </div>
              <CountdownTimer targetDate={nextQuiz.time} />
              {user ? (
                <Link href="/quiz/paid" className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full mt-6 hover:opacity-90 transition-opacity">
                  Join Now
                </Link>
              ) : (
                <Link href="/auth/signup" className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full mt-6 hover:opacity-90 transition-opacity">
                  Sign Up to Join
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Top Quizzes Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Featured Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-transform">
                <h3 className="text-xl font-semibold text-white mb-4">{quiz.title}</h3>
                <div className="text-white/80 mb-4">
                  <p>Prize Pool: ₹{(quiz.prizeMoney || []).reduce((a: number, b: number) => a + b, 0).toLocaleString()}</p>
                  <div className="flex items-center text-sm text-white/60">
                    <UserIcon className="w-4 h-4 mr-1" />
                    {quiz.maxParticipants ? `${quiz.maxParticipants} max participants` : 'Unlimited participants'}
                  </div>
                </div>
                <Link href={`/quiz/${quiz.id}`} className="inline-block bg-white/20 text-white py-2 px-4 rounded-full hover:bg-white/30 transition-colors">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Winners */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Recent Winners</h2>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentWinners.map((winner, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{winner.name}</div>
                    <div className="text-white/60">₹{winner.prize.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Daily Free Quizzes</h3>
            <p>Practice with our free quizzes and improve your knowledge</p>
            <Link href="/practice" className="inline-block mt-4 text-indigo-300 hover:text-indigo-200">
              Start Practice →
            </Link>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Real-time Competition</h3>
            <p>Compete with players across India in real-time</p>
            <Link href="/leaderboard" className="inline-block mt-4 text-indigo-300 hover:text-indigo-200">
              View Leaderboard →
            </Link>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Win Big Prizes</h3>
            <p>Participate in paid quizzes to win exciting cash prizes</p>
            <Link href="/quiz/paid" className="inline-block mt-4 text-indigo-300 hover:text-indigo-200">
              Browse Paid Quizzes →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
