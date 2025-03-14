'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { Quiz, Question, LeaderboardEntry } from '@/types';
import { useRouter } from 'next/navigation';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { processPayment } from '@/services/payment';

interface QuizPageProps {
  params: {
    id: string;
  };
}

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizStatus, setQuizStatus] = useState<'waiting' | 'started' | 'ended'>('waiting');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', params.id));
        if (quizDoc.exists()) {
          const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
          setQuiz(quizData);
          
          // Check if user has already joined for paid quizzes
          if (quizData.type === 'paid' && quizData.participants.includes(user?.uid || '')) {
            // Show payment UI or confirmation
          }
          
          // Set initial question
          if (quizData.questions.length > 0) {
            setCurrentQuestion(quizData.questions[0]);
            setTimeLeft(quizData.questions[0].timeLimit);
          }
        }
      } catch (error) {
        setError('Error loading quiz');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchQuiz();
    }
  }, [params.id, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (quizStatus === 'started' && timeLeft > 0) {
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
  }, [quizStatus, timeLeft]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (quizStatus === 'started') {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleQuizEnd(true); // Disqualify user
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quizStatus]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (quizStatus === 'started' && !document.fullscreenElement) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleQuizEnd(true); // Disqualify user
          }
          return newCount;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [quizStatus]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (quizStatus === 'started') e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizStatus === 'started' && (e.ctrlKey || e.altKey || e.metaKey)) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [quizStatus]);

  const startQuiz = () => {
    setQuizStatus('started');
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answerIndex);
      if (currentQuestion && answerIndex === currentQuestion.correctAnswer) {
        setScore((prev) => prev + currentQuestion.points);
      }
    }
  };

  const handleNextQuestion = async () => {
    if (!quiz) return;

    if (questionIndex < quiz.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setCurrentQuestion(quiz.questions[questionIndex + 1]);
      setTimeLeft(quiz.questions[questionIndex + 1].timeLimit);
      setSelectedAnswer(null);
    } else {
      // Quiz ended
      setQuizStatus('ended');
      await updateQuizResults();
    }
  };

  const updateQuizResults = async () => {
    if (!quiz || !user) return;

    try {
      // Update user's score in Firestore
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        [`results.${user.uid}`]: {
          score,
          timeSpent: quiz.duration - timeLeft,
          completedAt: new Date(),
        },
      });

      // Update leaderboard
      fetchLeaderboard();
    } catch (error) {
      setError('Error saving results');
    }
  };

  const fetchLeaderboard = async () => {
    if (!quiz) return;

    try {
      const quizDoc = await getDoc(doc(db, 'quizzes', quiz.id));
      if (quizDoc.exists()) {
        const results = quizDoc.data().results || {};
        const entries: LeaderboardEntry[] = await Promise.all(
          Object.entries(results).map(async ([userId, data]: [string, any]) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return {
              userId,
              userName: userDoc.data()?.name || 'Unknown Player',
              score: data.score,
              timeSpent: data.timeSpent,
              rank: 0, // Will be calculated below
            };
          })
        );

        // Sort by score (desc) and time spent (asc)
        entries.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.timeSpent - b.timeSpent;
        });

        // Assign ranks
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
          if (entry.userId === user?.uid) {
            setUserRank(entry);
          }
        });

        setLeaderboard(entries);
      }
    } catch (error) {
      setError('Error loading leaderboard');
    }
  };

  const handlePayment = async () => {
    if (!quiz || !user) return;

    try {
      setLoading(true);
      // Integrate with payment gateway (PhonePe, Google Pay, UPI)
      const paymentResult = await processPayment({
        amount: quiz.entryFee || 0,
        userId: user.uid,
        quizId: quiz.id,
        paymentMethods: ['phonepe', 'googlepay', 'upi']
      });

      if (paymentResult.success) {
        setPaymentStatus('completed');
        // Add user to quiz participants
        await updateDoc(doc(db, 'quizzes', quiz.id), {
          participants: arrayUnion(user.uid)
        });
      } else {
        setPaymentStatus('failed');
        setError('Payment failed. Please try again.');
      }
    } catch (error) {
      setPaymentStatus('failed');
      setError('Error processing payment');
    } finally {
      setLoading(false);
      setShowPaymentModal(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Join me on Captain Quizzardo - ${quiz?.title}`,
      text: `I'm participating in ${quiz?.title} quiz on Captain Quizzardo! Join me and test your knowledge.`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        setError('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleQuizEnd = async (disqualified: boolean = false) => {
    if (!quiz || !user) return;

    setQuizStatus('ended');
    const finalScore = disqualified ? 0 : score;

    try {
      // Update quiz results
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        [`results.${user.uid}`]: {
          score: finalScore,
          timeSpent: quiz.duration - timeLeft,
          completedAt: new Date(),
          disqualified
        }
      });

      // Update user stats
      await updateDoc(doc(db, 'users', user.uid), {
        'stats.totalQuizzes': increment(1),
        'stats.totalWinnings': increment(disqualified ? 0 : calculatePrize(finalScore, quiz))
      });

      fetchLeaderboard();
    } catch (error) {
      setError('Error saving results');
    }
  };

  const calculatePrize = (score: number, quiz: Quiz) => {
    const totalPrize = quiz.prizePool || 0;
    const userRank = leaderboard.find(entry => entry.userId === user?.uid)?.rank || 0;
    
    // Prize distribution based on rank
    switch(userRank) {
      case 1: return totalPrize * 0.5; // 50% for first place
      case 2: return totalPrize * 0.3; // 30% for second place
      case 3: return totalPrize * 0.2; // 20% for third place
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Quiz not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {quizStatus === 'waiting' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">{quiz.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 mb-1">Entry Fee</div>
                <div className="text-2xl font-bold text-white">₹{quiz.entryFee || 0}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 mb-1">Prize Pool</div>
                <div className="text-2xl font-bold text-white">₹{quiz.prizePool || 0}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 mb-1">Participants</div>
                <div className="text-2xl font-bold text-white">
                  {quiz.participants?.length || 0} / {quiz.maxParticipants || 100}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 mb-1">Start Time</div>
                <CountdownTimer targetDate={quiz.startTime} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Quiz Rules</h2>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li>Quiz will start at the scheduled time</li>
                  <li>Each question has a time limit</li>
                  <li>Switching tabs or exiting fullscreen will count as cheating</li>
                  <li>Three violations will result in disqualification</li>
                  <li>Prize money will be distributed to top 3 winners</li>
                </ul>
              </div>

              {quiz.type === 'paid' && !quiz.participants.includes(user?.uid) ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-white text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                >
                  Pay Entry Fee & Join Quiz
                </button>
              ) : (
                <button
                  onClick={startQuiz}
                  disabled={new Date(quiz.startTime) > new Date()}
                  className="w-full bg-white text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {new Date(quiz.startTime) > new Date() ? 'Waiting for start time' : 'Start Quiz'}
                </button>
              )}

              <button
                onClick={handleShare}
                className="w-full bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                Share Quiz
              </button>
            </div>
          </div>
        )}

        {quizStatus === 'started' && currentQuestion && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="text-white">
                Question {questionIndex + 1}/{quiz.questions.length}
              </div>
              <div className="text-white font-bold">
                Time Left: {timeLeft}s
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                {currentQuestion.text}
              </h2>
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      selectedAnswer === index
                        ? 'bg-white text-indigo-600'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {selectedAnswer !== null && (
              <button
                className="w-full bg-white text-indigo-600 py-3 rounded-full font-bold hover:bg-indigo-100 transition-colors"
                onClick={handleNextQuestion}
              >
                Next Question
              </button>
            )}
          </div>
        )}

        {quizStatus === 'ended' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Quiz Complete!</h1>

            {tabSwitches >= 3 ? (
              <div className="bg-red-500/20 text-red-300 px-6 py-4 rounded-lg mb-6">
                You have been disqualified for violating quiz rules.
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-white mb-2">
                    {Math.round((score / (quiz.totalPoints || 100)) * 100)}%
                  </div>
                  <div className="text-white/80">
                    Score: {score} / {quiz.totalPoints || 100}
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white/5 rounded-lg p-6 mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4">Leaderboard</h2>
                  <div className="space-y-4">
                    {leaderboard.slice(0, 10).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          entry.userId === user?.uid
                            ? 'bg-white/20'
                            : 'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold
                            ${entry.rank === 1 ? 'bg-yellow-500' :
                              entry.rank === 2 ? 'bg-gray-300' :
                              entry.rank === 3 ? 'bg-orange-500' : 'bg-white/10'}
                          `}>
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {entry.userName}
                            </div>
                            <div className="text-sm text-white/60">
                              Score: {entry.score} • Time: {entry.timeSpent}s
                            </div>
                          </div>
                        </div>
                        {entry.rank <= 3 && (
                          <div className="text-lg font-bold text-white">
                            ₹{calculatePrize(entry.score, quiz)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => router.push('/quiz')}
                    className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Back to Quizzes
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-white text-indigo-600 py-3 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Share Results
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-white">
                  <span>Entry Fee</span>
                  <span>₹{quiz.entryFee || 0}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Prize Pool</span>
                  <span>₹{quiz.prizePool || 0}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-white text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Pay with UPI'}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
