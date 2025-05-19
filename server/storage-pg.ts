import { IStorage } from './storage';
import {
  User, InsertUser,
  Exam, InsertExam,
  Question, InsertQuestion,
  Attachment, InsertAttachment,
  ExamAttempt, InsertExamAttempt,
  UserAnswer, InsertUserAnswer,
  users, exams, questions, attachments, examAttempts, userAnswers
} from '@shared/schema';

import { nanoid } from 'nanoid';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, and, isNull, count, sql } from 'drizzle-orm';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private neonClient: NeonQueryFunction;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    this.neonClient = neon(process.env.DATABASE_URL);
    this.db = drizzle(this.neonClient);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await this.db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await this.db.insert(users)
      .values({
        ...user,
        avatar: user.avatar || null,
        role: user.role || 'user',
        createdAt: new Date()
      })
      .returning();
    return results[0];
  }

  // Exam methods
  async getExam(id: number): Promise<Exam | undefined> {
    const results = await this.db.select()
      .from(exams)
      .where(eq(exams.id, id))
      .limit(1);
    return results[0];
  }

  async getExamByAccessCode(accessCode: string): Promise<Exam | undefined> {
    const results = await this.db.select()
      .from(exams)
      .where(eq(exams.accessCode, accessCode))
      .limit(1);
    return results[0];
  }

  async getExamsByUser(userId: number): Promise<Exam[]> {
    return await this.db.select()
      .from(exams)
      .where(eq(exams.createdBy, userId))
      .orderBy(desc(exams.createdAt));
  }

  async getExamWithQuestions(id: number): Promise<{ exam: Exam, questions: Question[] } | undefined> {
    const examResults = await this.db.select()
      .from(exams)
      .where(eq(exams.id, id))
      .limit(1);

    if (examResults.length === 0) {
      return undefined;
    }

    const questionResults = await this.db.select()
      .from(questions)
      .where(eq(questions.examId, id))
      .orderBy(questions.order);

    return {
      exam: examResults[0],
      questions: questionResults
    };
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const accessCode = nanoid(6).toUpperCase();
    
    const results = await this.db.insert(exams)
      .values({
        ...exam,
        accessCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: exam.subject || null,
        grade: exam.grade || null,
        description: exam.description || null,
        status: exam.status || 'active',
        shuffleQuestions: exam.shuffleQuestions || false,
        showResults: exam.showResults || true,
        showCorrectAnswers: exam.showCorrectAnswers || false,
        allowReview: exam.allowReview || true
      })
      .returning();
    
    return results[0];
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    const results = await this.db.update(exams)
      .set({
        ...examData,
        updatedAt: new Date()
      })
      .where(eq(exams.id, id))
      .returning();
    
    return results[0];
  }

  async deleteExam(id: number): Promise<boolean> {
    // Delete related questions first
    await this.db.delete(questions)
      .where(eq(questions.examId, id));
    
    // Delete related attachments
    await this.db.delete(attachments)
      .where(eq(attachments.examId, id));
    
    // Delete exam attempts
    const attemptIds = await this.db.select({ id: examAttempts.id })
      .from(examAttempts)
      .where(eq(examAttempts.examId, id));
    
    for (const { id: attemptId } of attemptIds) {
      await this.db.delete(userAnswers)
        .where(eq(userAnswers.attemptId, attemptId));
    }
    
    await this.db.delete(examAttempts)
      .where(eq(examAttempts.examId, id));
    
    // Delete exam
    const result = await this.db.delete(exams)
      .where(eq(exams.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Question methods
  async getQuestion(id: number): Promise<Question | undefined> {
    const results = await this.db.select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);
    
    return results[0];
  }

  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return await this.db.select()
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(questions.order);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const results = await this.db.insert(questions)
      .values({
        ...question,
        options: question.options || null,
        correctAnswer: question.correctAnswer || null,
        acceptedAnswers: question.acceptedAnswers || null
      })
      .returning();
    
    return results[0];
  }

  async updateQuestion(id: number, questionData: Partial<Question>): Promise<Question | undefined> {
    const results = await this.db.update(questions)
      .set(questionData)
      .where(eq(questions.id, id))
      .returning();
    
    return results[0];
  }

  async deleteQuestion(id: number): Promise<boolean> {
    // Delete all answers to this question
    const result = await this.db.delete(questions)
      .where(eq(questions.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Attachment methods
  async getAttachment(id: number): Promise<Attachment | undefined> {
    const results = await this.db.select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);
    
    return results[0];
  }

  async getAttachmentsByExam(examId: number): Promise<Attachment[]> {
    return await this.db.select()
      .from(attachments)
      .where(eq(attachments.examId, examId));
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const results = await this.db.insert(attachments)
      .values({
        ...attachment,
        createdAt: new Date()
      })
      .returning();
    
    return results[0];
  }

  async deleteAttachment(id: number): Promise<boolean> {
    const result = await this.db.delete(attachments)
      .where(eq(attachments.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Exam attempt methods
  async getExamAttempt(id: number): Promise<ExamAttempt | undefined> {
    const results = await this.db.select()
      .from(examAttempts)
      .where(eq(examAttempts.id, id))
      .limit(1);
    
    return results[0];
  }

  async getExamAttemptsByExam(examId: number): Promise<ExamAttempt[]> {
    return await this.db.select()
      .from(examAttempts)
      .where(eq(examAttempts.examId, examId))
      .orderBy(desc(examAttempts.startTime));
  }

  async getExamAttemptsByUser(userId: number): Promise<ExamAttempt[]> {
    return await this.db.select()
      .from(examAttempts)
      .where(eq(examAttempts.userId, userId))
      .orderBy(desc(examAttempts.startTime));
  }

  async createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt> {
    const results = await this.db.insert(examAttempts)
      .values({
        ...attempt,
        startTime: new Date(),
        status: attempt.status || 'in_progress',
        endTime: attempt.endTime || null,
        score: attempt.score || null,
        maxScore: attempt.maxScore || null
      })
      .returning();
    
    return results[0];
  }

  async updateExamAttempt(id: number, attemptData: Partial<ExamAttempt>): Promise<ExamAttempt | undefined> {
    const results = await this.db.update(examAttempts)
      .set(attemptData)
      .where(eq(examAttempts.id, id))
      .returning();
    
    return results[0];
  }

  // User answer methods
  async getUserAnswer(id: number): Promise<UserAnswer | undefined> {
    const results = await this.db.select()
      .from(userAnswers)
      .where(eq(userAnswers.id, id))
      .limit(1);
    
    return results[0];
  }

  async getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]> {
    return await this.db.select()
      .from(userAnswers)
      .where(eq(userAnswers.attemptId, attemptId));
  }

  async createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer> {
    const results = await this.db.insert(userAnswers)
      .values({
        ...answer,
        answer: answer.answer || null,
        score: answer.score || null,
        isCorrect: answer.isCorrect || null,
        reviewed: answer.reviewed || false,
        reviewRequested: answer.reviewRequested || false,
        reviewComment: answer.reviewComment || null
      })
      .returning();
    
    return results[0];
  }

  async updateUserAnswer(id: number, answerData: Partial<UserAnswer>): Promise<UserAnswer | undefined> {
    const results = await this.db.update(userAnswers)
      .set(answerData)
      .where(eq(userAnswers.id, id))
      .returning();
    
    return results[0];
  }

  // Dashboard methods
  async getStats(userId: number): Promise<{
    examCount: number;
    studentCount: number;
    completedCount: number;
    pendingCount: number;
  }> {
    // Get exam count
    const [examCountResult] = await this.db
      .select({ count: count() })
      .from(exams)
      .where(eq(exams.createdBy, userId));
    
    // Get student count (unique users who attempted this teacher's exams)
    const studentCountQuery = this.db
      .select({ count: count(examAttempts.userId, { distinct: true }) })
      .from(examAttempts)
      .innerJoin(exams, eq(examAttempts.examId, exams.id))
      .where(eq(exams.createdBy, userId));
    
    const [studentCountResult] = await studentCountQuery;
    
    // Get completed count
    const [completedCountResult] = await this.db
      .select({ count: count() })
      .from(examAttempts)
      .innerJoin(exams, eq(examAttempts.examId, exams.id))
      .where(and(
        eq(exams.createdBy, userId),
        eq(examAttempts.status, 'completed')
      ));
    
    // Get pending count
    const [pendingCountResult] = await this.db
      .select({ count: count() })
      .from(examAttempts)
      .innerJoin(exams, eq(examAttempts.examId, exams.id))
      .where(and(
        eq(exams.createdBy, userId),
        eq(examAttempts.status, 'in_progress')
      ));

    return {
      examCount: examCountResult.count,
      studentCount: studentCountResult.count,
      completedCount: completedCountResult.count,
      pendingCount: pendingCountResult.count
    };
  }

  async getRecentExams(userId: number, limit: number = 3): Promise<Exam[]> {
    return await this.db
      .select()
      .from(exams)
      .where(eq(exams.createdBy, userId))
      .orderBy(desc(exams.createdAt))
      .limit(limit);
  }

  async getRecentResults(userId: number, limit: number = 4): Promise<{
    attempt: ExamAttempt;
    exam: Exam;
    user: User;
  }[]> {
    const results = await this.db
      .select({
        attempt: examAttempts,
        exam: exams,
        user: users
      })
      .from(examAttempts)
      .innerJoin(exams, eq(examAttempts.examId, exams.id))
      .innerJoin(users, eq(examAttempts.userId, users.id))
      .where(eq(exams.createdBy, userId))
      .orderBy(desc(examAttempts.startTime))
      .limit(limit);
    
    return results;
  }

  async getReviewRequests(teacherId: number, limit: number = 5): Promise<{
    question: Question;
    answer: UserAnswer;
    user: User;
    exam: Exam;
  }[]> {
    const results = await this.db
      .select({
        question: questions,
        answer: userAnswers,
        user: users,
        exam: exams
      })
      .from(userAnswers)
      .innerJoin(questions, eq(userAnswers.questionId, questions.id))
      .innerJoin(examAttempts, eq(userAnswers.attemptId, examAttempts.id))
      .innerJoin(users, eq(examAttempts.userId, users.id))
      .innerJoin(exams, eq(questions.examId, exams.id))
      .where(and(
        eq(exams.createdBy, teacherId),
        eq(userAnswers.reviewRequested, true),
        eq(userAnswers.reviewed, false)
      ))
      .orderBy(desc(userAnswers.id))
      .limit(limit);
    
    return results;
  }
}

// Initialize database and push schema
export async function initializeDatabase() {
  try {
    // Connect to Postgres
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      return false;
    }
    
    console.log('Connecting to Postgres database...');
    const client = neon(process.env.DATABASE_URL);
    
    // Create tables if they don't exist - كل استدعاء منفصل
    console.log('Creating users table...');
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Creating exams table...');
    await client`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT,
        grade TEXT,
        duration INTEGER NOT NULL,
        access_code TEXT UNIQUE NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL,
        shuffle_questions BOOLEAN DEFAULT FALSE,
        show_results BOOLEAN DEFAULT TRUE,
        show_correct_answers BOOLEAN DEFAULT FALSE,
        allow_review BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Creating questions table...');
    await client`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        options JSONB,
        correct_answer JSONB,
        accepted_answers JSONB,
        points INTEGER NOT NULL,
        "order" INTEGER NOT NULL
      );
    `;
    
    console.log('Creating attachments table...');
    await client`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Creating exam_attempts table...');
    await client`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_time TIMESTAMP WITH TIME ZONE,
        score INTEGER,
        max_score INTEGER
      );
    `;
    
    console.log('Creating user_answers table...');
    await client`
      CREATE TABLE IF NOT EXISTS user_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        answer JSONB,
        score INTEGER,
        is_correct BOOLEAN,
        reviewed BOOLEAN DEFAULT FALSE,
        review_requested BOOLEAN DEFAULT FALSE,
        review_comment TEXT
      );
    `;
    
    console.log('Database tables created successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Export singleton instance
const pgStorage = new PostgresStorage();
export { pgStorage };