import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("teacher"), // teacher or student
  createdAt: timestamp("created_at").defaultNow()
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  grade: text("grade"),
  duration: integer("duration").notNull(), // in minutes
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed
  shuffleQuestions: boolean("shuffle_questions").default(false),
  showResults: boolean("show_results").default(true),
  showCorrectAnswers: boolean("show_correct_answers").default(false),
  allowReview: boolean("allow_review").default(true),
  examDate: timestamp("exam_date"),
  accessCode: text("access_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  type: text("type").notNull(), // multiple-choice, true-false, essay
  content: text("content").notNull(),
  options: jsonb("options"), // For multiple choice questions
  correctAnswer: jsonb("correct_answer"), // Can be string, number, boolean, or array of strings
  points: integer("points").notNull().default(1),
  order: integer("order").notNull(),
  acceptedAnswers: jsonb("accepted_answers"), // Array of accepted answers for essay questions
});

// Attachments table
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  name: text("name").notNull(),
  fileType: text("file_type").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// ExamAttempts table
export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  score: integer("score"),
  maxScore: integer("max_score"),
  status: text("status").notNull().default("in-progress"), // in-progress, completed
});

// UserAnswers table
export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: jsonb("answer"), // Can be string, number, boolean, or array
  isCorrect: boolean("is_correct"),
  score: integer("score"),
  reviewed: boolean("reviewed").default(false),
  reviewRequested: boolean("review_requested").default(false),
  reviewComment: text("review_comment"),
});

// Define schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true });
export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({ id: true, startTime: true });
export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({ id: true });

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;

export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;
