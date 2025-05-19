import { Question } from "@shared/schema";

/**
 * Format duration in minutes to a readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g. "45 دقيقة" or "1 ساعة و 30 دقيقة")
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
};

/**
 * Calculate exam score based on answers and questions
 * @param answers - User answers (key: questionId, value: answer)
 * @param questions - Array of exam questions
 * @returns Object containing score, maxScore, and percentage
 */
export const calculateExamScore = (
  answers: Record<number, any>,
  questions: Question[]
): { score: number; maxScore: number; percentage: number } => {
  let score = 0;
  let maxScore = 0;
  
  questions.forEach(question => {
    maxScore += question.points;
    
    const userAnswer = answers[question.id];
    if (!userAnswer) return;
    
    // Skip scoring for essay questions (they require manual review)
    if (question.type === "essay") return;
    
    // Score multiple-choice and true-false questions
    if (
      (question.type === "multiple-choice" || question.type === "true-false") && 
      userAnswer === question.correctAnswer
    ) {
      score += question.points;
    }
  });
  
  // Calculate percentage, avoid division by zero
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  return { score, maxScore, percentage };
};

/**
 * Shuffle an array of questions (for randomized exam questions)
 * @param questions - Array of questions to shuffle
 * @returns Shuffled array of questions with updated order property
 */
export const shuffleQuestions = (questions: Question[]): Question[] => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  
  // Update order property to maintain correct numbering
  return shuffled.map((question, index) => ({
    ...question,
    order: index + 1
  }));
};

/**
 * Check if an essay answer matches any of the accepted answers
 * @param userAnswer - User's essay answer
 * @param acceptedAnswers - Array of accepted answers
 * @returns Boolean indicating if the answer is close to any accepted answer
 */
export const isEssayAnswerAcceptable = (
  userAnswer: string,
  acceptedAnswers: string[]
): boolean => {
  if (!acceptedAnswers || acceptedAnswers.length === 0) return false;
  
  // This is a very simple implementation that checks if the answer contains
  // key words from any accepted answer. A more sophisticated implementation
  // would use NLP techniques for Arabic language.
  
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  
  return acceptedAnswers.some(acceptedAnswer => {
    const normalizedAcceptedAnswer = acceptedAnswer.trim().toLowerCase();
    
    // Extract key words (words with 4 or more characters)
    const keyWords = normalizedAcceptedAnswer
      .split(/\s+/)
      .filter(word => word.length >= 4);
    
    // Count how many key words are in the user's answer
    const matchedWords = keyWords.filter(word => 
      normalizedUserAnswer.includes(word)
    );
    
    // If at least 60% of key words are matched, consider it acceptable
    return keyWords.length > 0 && 
      matchedWords.length / keyWords.length >= 0.6;
  });
};

/**
 * Format a grade based on percentage
 * @param percentage - Score percentage (0-100)
 * @returns Object with grade letter and color class
 */
export const formatGrade = (percentage: number): { grade: string; colorClass: string } => {
  if (percentage >= 90) {
    return { grade: "ممتاز", colorClass: "text-success" };
  } else if (percentage >= 80) {
    return { grade: "جيد جداً", colorClass: "text-success" };
  } else if (percentage >= 70) {
    return { grade: "جيد", colorClass: "text-success" };
  } else if (percentage >= 60) {
    return { grade: "مقبول", colorClass: "text-secondary" };
  } else {
    return { grade: "راسب", colorClass: "text-destructive" };
  }
};

/**
 * Calculate remaining time for an exam
 * @param startTime - Exam start time
 * @param durationMinutes - Exam duration in minutes
 * @returns Remaining time in seconds, or 0 if time is up
 */
export const calculateRemainingTime = (
  startTime: Date,
  durationMinutes: number
): number => {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  
  const remainingMs = endTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(remainingMs / 1000));
};

/**
 * Format remaining time in seconds to a readable string
 * @param seconds - Remaining time in seconds
 * @returns Formatted time string (e.g. "45:30")
 */
export const formatRemainingTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
