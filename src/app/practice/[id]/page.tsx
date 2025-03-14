'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Question {
  text: string;
  options: string[];
  correctOption: number;
  points: number;
  timeLimit: number;
}

interface PracticeQuiz {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  questions: Question[];
  totalPoints: number;
  completions: number;
  averageScore: number;
}

export default function PracticeQuizPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<PracticeQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    explanation?: string;
  } | null>(null);

  // Anti-cheating measures
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (quizStarted && !quizCompleted) {
        setTabSwitchCount((prev) => prev + 1);
        if (tabSwitchCount >= 2) {
          handleQuizEnd(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizStarted, quizCompleted, tabSwitchCount]);

  // Prevent right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (quizStarted && !quizCompleted) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [quizStarted, quizCompleted]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, timeLeft]);

  useEffect(() => {
    fetchQuiz();
  }, [params.id]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const quizDoc = await getDoc(doc(db, 'practiceQuizzes', params.id));
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() } as PracticeQuiz);
      } else {
        setError('Quiz not found');
      }
    } catch (error) {
      setError('Error loading quiz: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (!quiz) return;
    setQuizStarted(true);
    setTimeLeft(quiz.questions[0].timeLimit);
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null || !quiz) return;
    setSelectedOption(optionIndex);

    const correct = optionIndex === quiz.questions[currentQuestion].correctOption;
    if (correct) {
      setScore((prev) => prev + quiz.questions[currentQuestion].points);
    }

    setFeedback({
      correct,
      explanation: correct
        ? 'Correct! Well done!'
        : `Incorrect. The correct answer was ${
            String.fromCharCode(65 + quiz.questions[currentQuestion].correctOption)
          }`,
    });

    // Auto-advance after 2 seconds
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    setAnswers([...answers, selectedOption || -1]);
    setSelectedOption(null);
    setFeedback(null);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setTimeLeft(quiz.questions[currentQuestion + 1].timeLimit);
    } else {
      handleQuizEnd();
    }
  };

  const handleQuizEnd = async (disqualified: boolean = false) => {
    if (!quiz || !user) return;

    setQuizCompleted(true);
    const finalScore = disqualified ? 0 : score;
    const percentage = Math.round((finalScore / quiz.totalPoints) * 100);

    try {
      // Update quiz statistics
      await updateDoc(doc(db, 'practiceQuizzes', quiz.id), {
        completions: increment(1),
        averageScore: increment(percentage / (quiz.completions + 1)),
      });

      // Update user progress
      const userProgressRef = doc(db, 'userProgress', user.uid);
      await updateDoc(userProgressRef, {
        quizzesTaken: increment(1),
        recentScores: arrayUnion({
          quizId: quiz.id,
          score: percentage,
          date: serverTimestamp(),
        }),
      });
    } catch (error) {
      console.error('Error updating quiz statistics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / quiz.totalPoints) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Quiz Complete!</h1>

            {tabSwitchCount >= 2 ? (
              <div className="bg-red-500/20 text-red-300 px-6 py-4 rounded-lg mb-6">
                You have been disqualified for switching tabs too many times.
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-white mb-2">
                    {percentage}%
                  </div>
                  <div className="text-white/80">
                    Score: {score} / {quiz.totalPoints}
                  </div>
                </div>

                <div className="space-y-6">
                  {quiz.questions.map((question, index) => (
                    <div
                      key={index}
                      className={`bg-white/5 rounded-lg p-4 ${
                        answers[index] === question.correctOption
                          ? 'border-2 border-green-500/50'
                          : 'border-2 border-red-500/50'
                      }`}
                    >
                      <div className="font-medium text-white mb-2">
                        {index + 1}. {question.text}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`px-4 py-2 rounded-lg ${
                              optIndex === question.correctOption
                                ? 'bg-green-500/20 text-green-300'
                                : optIndex === answers[index]
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-white/5 text-white/80'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => router.push('/practice')}
                className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                Back to Practice
              </button>
              <button
                onClick={() => router.refresh()}
                className="flex-1 bg-white text-indigo-600 py-3 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
          {!quizStarted ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">{quiz.title}</h1>
              <div className="space-y-4 text-white/80 mb-8">
                <p>Category: {quiz.category}</p>
                <p>
                  Difficulty:{' '}
                  {quiz.difficulty.charAt(0).toUpperCase() +
                    quiz.difficulty.slice(1)}
                </p>
                <p>Questions: {quiz.questions.length}</p>
                <p>Total Points: {quiz.totalPoints}</p>
              </div>

              <div className="bg-white/5 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Rules:</h2>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li>Each question has a time limit</li>
                  <li>You cannot return to previous questions</li>
                  <li>Switching tabs more than twice will disqualify you</li>
                  <li>Your progress will be saved to your profile</li>
                </ul>
              </div>

              <button
                onClick={startQuiz}
                className="w-full bg-white text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
              >
                Start Practice Quiz
              </button>
            </>
          ) : (
            <>
              {/* Quiz Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="text-white/60 text-sm">Question</div>
                  <div className="text-2xl font-bold text-white">
                    {currentQuestion + 1} / {quiz.questions.length}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Time Left</div>
                  <div
                    className={`text-2xl font-bold ${
                      timeLeft <= 5 ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    {timeLeft}s
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Score</div>
                  <div className="text-2xl font-bold text-white">
                    {score} / {quiz.totalPoints}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full mb-8">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl font-medium text-white mb-6">
                  {quiz.questions[currentQuestion].text}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quiz.questions[currentQuestion].options.map(
                    (option, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => handleOptionSelect(optIndex)}
                        disabled={selectedOption !== null}
                        className={`p-4 rounded-lg text-left transition-colors ${
                          selectedOption === null
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : optIndex === selectedOption
                            ? feedback?.correct
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                            : optIndex === quiz.questions[currentQuestion].correctOption &&
                              feedback?.correct === false
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-white/5 text-white/60'
                        }`}
                      >
                        <div className="flex items-start">
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {option}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div
                  className={`p-4 rounded-lg mb-8 ${
                    feedback.correct
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {feedback.explanation}
                </div>
              )}

              {/* Points */}
              <div className="text-center text-white/60">
                This question is worth {quiz.questions[currentQuestion].points}{' '}
                points
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
