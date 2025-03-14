'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  updateDoc,
} from 'firebase/firestore';
import Link from 'next/link';

interface PracticeQuiz {
  id: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: any[];
  totalPoints: number;
  completions: number;
  averageScore: number;
}

interface UserProgress {
  quizzesTaken: number;
  averageScore: number;
  strongCategories: string[];
  weakCategories: string[];
  recentScores: {
    quizId: string;
    score: number;
    date: Date;
  }[];
}

export default function PracticePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<PracticeQuiz[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'General Knowledge',
    'Science',
    'Technology',
    'Sports',
    'Entertainment',
    'History',
    'Geography',
    'Literature',
    'Mathematics',
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    fetchQuizzes();
    if (user) {
      fetchUserProgress();
    }
  }, [user, selectedCategory, selectedDifficulty]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const quizzesRef = collection(db, 'practiceQuizzes');
      let q = query(quizzesRef, orderBy('completions', 'desc'), limit(50));

      if (selectedCategory !== 'all') {
        q = query(q, where('category', '==', selectedCategory));
      }

      if (selectedDifficulty !== 'all') {
        q = query(q, where('difficulty', '==', selectedDifficulty));
      }

      const snapshot = await getDocs(q);
      const quizData: PracticeQuiz[] = [];
      snapshot.forEach((doc) => {
        quizData.push({ id: doc.id, ...doc.data() } as PracticeQuiz);
      });

      // Filter by search query if present
      const filteredQuizzes = searchQuery
        ? quizData.filter((quiz) =>
            quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : quizData;

      setQuizzes(filteredQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const userDoc = await getDocs(
        query(collection(db, 'userProgress'), where('userId', '==', user.uid))
      );

      if (!userDoc.empty) {
        setUserProgress(userDoc.docs[0].data() as UserProgress);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {/* User Progress Section */}
        {user && userProgress && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/80 mb-1">Quizzes Taken</div>
                <div className="text-3xl font-bold text-white">
                  {userProgress.quizzesTaken}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/80 mb-1">Average Score</div>
                <div className="text-3xl font-bold text-white">
                  {userProgress.averageScore}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/80 mb-1">Strong Categories</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userProgress.strongCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/80 mb-1">Areas to Improve</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userProgress.weakCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Scores */}
            {userProgress.recentScores.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Recent Scores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userProgress.recentScores.map((score, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between text-white/80">
                        <span>Score</span>
                        <span>{score.score}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(score.score)}`}
                          style={{ width: `${score.score}%` }}
                        />
                      </div>
                      <div className="text-sm text-white/60">
                        {new Date(score.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Search Quizzes
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Difficulties</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchQuizzes}
                className="w-full bg-white text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="text-center text-white py-8">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center text-white py-8">
            No quizzes found matching your criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/practice/${quiz.id}`}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {quiz.title}
                  </h3>
                  <span
                    className={`text-sm font-medium ${getDifficultyColor(
                      quiz.difficulty
                    )}`}
                  >
                    {quiz.difficulty.charAt(0).toUpperCase() +
                      quiz.difficulty.slice(1)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-white/80">
                    <span>Category</span>
                    <span>{quiz.category}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Questions</span>
                    <span>{quiz.questions.length}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Total Points</span>
                    <span>{quiz.totalPoints}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Times Completed</span>
                    <span>{quiz.completions}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Average Score</span>
                    <span>{quiz.averageScore}%</span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="w-full bg-white text-indigo-600 py-2 rounded-lg text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Start Practice
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
