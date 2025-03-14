'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Quiz } from '@/types';
import Link from 'next/link';

type Category = 'all' | 'general' | 'sports' | 'science' | 'history';
type Difficulty = 'all' | 'easy' | 'medium' | 'hard';

export default function PracticeQuizPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError('');

        const quizRef = collection(db, 'quizzes');
        let q = query(
          quizRef,
          where('type', '==', 'free'),
          where('isActive', '==', true)
        );

        // Add category filter if not 'all'
        if (category !== 'all') {
          q = query(q, where('category', '==', category));
        }

        // Add difficulty filter if not 'all'
        if (difficulty !== 'all') {
          q = query(q, where('difficulty', '==', difficulty));
        }

        const querySnapshot = await getDocs(q);
        const quizData: Quiz[] = [];
        querySnapshot.forEach((doc) => {
          quizData.push({ id: doc.id, ...doc.data() } as Quiz);
        });

        setQuizzes(quizData);
      } catch (error) {
        setError('Error fetching practice quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [category, difficulty]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Practice Zone</h1>
            <p className="text-white/80">
              Sharpen your skills with our free practice quizzes
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="bg-white/10 text-white rounded-md px-4 py-2 border border-white/20"
              >
                <option value="all">All Categories</option>
                <option value="general">General Knowledge</option>
                <option value="sports">Sports</option>
                <option value="science">Science</option>
                <option value="history">History</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="bg-white/10 text-white rounded-md px-4 py-2 border border-white/20"
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white">Loading quizzes...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : quizzes.length === 0 ? (
            <div className="text-center text-white">
              No practice quizzes available for the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {quiz.title}
                      </h3>
                      <p className="text-white/80 mb-4">{quiz.description}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        quiz.difficulty === 'easy'
                          ? 'bg-green-500/20 text-green-300'
                          : quiz.difficulty === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {quiz.difficulty?.charAt(0).toUpperCase() +
                        quiz.difficulty?.slice(1)}
                    </div>
                  </div>

                  <div className="space-y-2 text-white/80 text-sm mb-6">
                    <div>Questions: {quiz.questions.length}</div>
                    <div>Duration: {quiz.duration} minutes</div>
                    <div>Category: {quiz.category}</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-white/80 text-sm">
                      {quiz.participants?.length || 0} attempts
                    </div>
                    <Link
                      href={`/quiz/${quiz.id}`}
                      className="bg-white text-indigo-600 px-6 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors"
                    >
                      Start Practice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {user?.practiceStats?.totalQuizzes || 0}
              </div>
              <div className="text-white/80">Practice Quizzes Completed</div>
            </div>
            <div className="bg-white/5 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {user?.practiceStats?.averageScore || 0}%
              </div>
              <div className="text-white/80">Average Score</div>
            </div>
            <div className="bg-white/5 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {user?.practiceStats?.bestScore || 0}%
              </div>
              <div className="text-white/80">Best Score</div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Tips for Success
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">
                  Time Management
                </h3>
                <p className="text-white/80">
                  Each question has a time limit. Practice managing your time
                  effectively to improve your performance in paid quizzes.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">
                  Read Carefully
                </h3>
                <p className="text-white/80">
                  Take your time to read each question and all options carefully
                  before selecting your answer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
