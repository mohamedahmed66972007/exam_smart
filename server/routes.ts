import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pgStorage } from "./storage-pg"; // استيراد واجهة تخزين PostgreSQL
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import pgSession from "connect-pg-simple";
import { z } from "zod";
import { insertUserSchema, insertExamSchema, insertQuestionSchema, insertExamAttemptSchema, insertUserAnswerSchema } from "@shared/schema";

const MemoryStoreSession = MemoryStore(session);
const PgStore = pgSession(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // حدد نوع التخزين المستخدم (PostgreSQL في الإنتاج، MemoryStore في التطوير)
  const sessionStore = process.env.DATABASE_URL
    ? new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      })
    : new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      });

  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "arabicexamsecret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: sessionStore,
    })
  );

  // Configure Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // حدد نوع التخزين المستخدم استنادًا إلى توفر متغيرات البيئة
  const db = process.env.DATABASE_URL ? pgStorage : storage;

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await db.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // API Routes
  const router = express.Router();

  // Auth Routes
  router.post("/auth/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  router.post("/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await db.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await db.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await db.createUser(userData);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  router.post("/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  router.get("/auth/current-user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Dashboard Routes
  router.get("/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    const stats = await db.getStats(user.id);
    res.json(stats);
  });

  router.get("/dashboard/recent-exams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
    const exams = await db.getRecentExams(user.id, limit);
    res.json(exams);
  });

  router.get("/dashboard/recent-results", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
    const results = await db.getRecentResults(user.id, limit);
    res.json(results);
  });

  router.get("/dashboard/review-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const reviewRequests = await db.getReviewRequests(user.id, limit);
    res.json(reviewRequests);
  });

  // Exam Routes
  router.get("/exams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    const exams = await db.getExamsByUser(user.id);
    res.json(exams);
  });

  router.get("/exams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const examId = parseInt(req.params.id);
    const examWithQuestions = await db.getExamWithQuestions(examId);
    
    if (!examWithQuestions) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    res.json(examWithQuestions);
  });

  router.post("/exams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as any;
      const examData = insertExamSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      const exam = await db.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid exam data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating exam" });
    }
  });

  router.put("/exams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const examId = parseInt(req.params.id);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    const user = req.user as any;
    if (exam.createdBy !== user.id) {
      return res.status(403).json({ message: "Not authorized to update this exam" });
    }
    
    try {
      const updatedExam = await storage.updateExam(examId, req.body);
      res.json(updatedExam);
    } catch (error) {
      res.status(500).json({ message: "Error updating exam" });
    }
  });

  router.delete("/exams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const examId = parseInt(req.params.id);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    const user = req.user as any;
    if (exam.createdBy !== user.id) {
      return res.status(403).json({ message: "Not authorized to delete this exam" });
    }
    
    const success = await storage.deleteExam(examId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Error deleting exam" });
    }
  });

  // Questions Routes
  router.post("/exams/:examId/questions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const examId = parseInt(req.params.examId);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    const user = req.user as any;
    if (exam.createdBy !== user.id) {
      return res.status(403).json({ message: "Not authorized to add questions to this exam" });
    }
    
    try {
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        examId
      });
      
      const question = await db.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating question" });
    }
  });

  router.put("/questions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const questionId = parseInt(req.params.id);
    const question = await db.getQuestion(questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const exam = await db.getExam(question.examId);
    if (!exam) {
      return res.status(404).json({ message: "Associated exam not found" });
    }
    
    const user = req.user as any;
    if (exam.createdBy !== user.id) {
      return res.status(403).json({ message: "Not authorized to update this question" });
    }
    
    try {
      const updatedQuestion = await db.updateQuestion(questionId, req.body);
      res.json(updatedQuestion);
    } catch (error) {
      res.status(500).json({ message: "Error updating question" });
    }
  });

  router.delete("/questions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const questionId = parseInt(req.params.id);
    const question = await db.getQuestion(questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const exam = await db.getExam(question.examId);
    if (!exam) {
      return res.status(404).json({ message: "Associated exam not found" });
    }
    
    const user = req.user as any;
    if (exam.createdBy !== user.id) {
      return res.status(403).json({ message: "Not authorized to delete this question" });
    }
    
    const success = await db.deleteQuestion(questionId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Error deleting question" });
    }
  });

  // Exam attempt routes
  router.get("/exams/:examId/attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const examId = parseInt(req.params.examId);
    const exam = await db.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    const user = req.user as any;
    if (exam.createdBy !== user.id) {
      return res.status(403).json({ message: "Not authorized to view attempts for this exam" });
    }
    
    const attempts = await db.getExamAttemptsByExam(examId);
    
    // Enrich attempts with user data
    const enrichedAttempts = await Promise.all(
      attempts.map(async (attempt) => {
        const user = await db.getUser(attempt.userId);
        return { ...attempt, user };
      })
    );
    
    res.json(enrichedAttempts);
  });

  router.post("/exams/:examId/attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const examId = parseInt(req.params.examId);
    const exam = await db.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    const user = req.user as any;
    
    try {
      const attemptData = insertExamAttemptSchema.parse({
        examId,
        userId: user.id,
        status: "in-progress"
      });
      
      const attempt = await db.createExamAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attempt data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating attempt" });
    }
  });

  router.put("/attempts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const attemptId = parseInt(req.params.id);
    const attempt = await db.getExamAttempt(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    
    const user = req.user as any;
    if (attempt.userId !== user.id) {
      const exam = await db.getExam(attempt.examId);
      if (!exam || exam.createdBy !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this attempt" });
      }
    }
    
    try {
      const updatedAttempt = await db.updateExamAttempt(attemptId, req.body);
      res.json(updatedAttempt);
    } catch (error) {
      res.status(500).json({ message: "Error updating attempt" });
    }
  });

  // User answers routes
  router.post("/attempts/:attemptId/answers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const attemptId = parseInt(req.params.attemptId);
    const attempt = await db.getExamAttempt(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    
    const user = req.user as any;
    if (attempt.userId !== user.id) {
      return res.status(403).json({ message: "Not authorized to add answers to this attempt" });
    }
    
    try {
      const answerData = insertUserAnswerSchema.parse({
        ...req.body,
        attemptId
      });
      
      // Check if the question exists and belongs to the right exam
      const question = await db.getQuestion(answerData.questionId);
      if (!question || question.examId !== attempt.examId) {
        return res.status(400).json({ message: "Invalid question for this attempt" });
      }
      
      // Validate and auto-grade if possible
      let isCorrect = false;
      let score = 0;
      
      if (question.type !== "essay" && question.correctAnswer !== null) {
        if (question.type === "true-false" || question.type === "multiple-choice") {
          isCorrect = answerData.answer === question.correctAnswer;
          score = isCorrect ? question.points : 0;
        }
      }
      
      const answer = await db.createUserAnswer({
        ...answerData,
        isCorrect,
        score
      });
      
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating answer" });
    }
  });

  router.put("/answers/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const answerId = parseInt(req.params.id);
    const answer = await storage.getUserAnswer(answerId);
    
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    const attempt = await storage.getExamAttempt(answer.attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Associated attempt not found" });
    }
    
    const user = req.user as any;
    
    // Student can request review, teacher can update the score
    if (attempt.userId !== user.id) {
      const exam = await storage.getExam(attempt.examId);
      if (!exam || exam.createdBy !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this answer" });
      }
    } else {
      // Students can only update reviewRequested field
      const allowedFields = ["reviewRequested"];
      const requestedUpdates = Object.keys(req.body);
      const isValidOperation = requestedUpdates.every(field => allowedFields.includes(field));
      
      if (!isValidOperation) {
        return res.status(400).json({ message: "Invalid updates" });
      }
    }
    
    try {
      const updatedAnswer = await storage.updateUserAnswer(answerId, req.body);
      res.json(updatedAnswer);
    } catch (error) {
      res.status(500).json({ message: "Error updating answer" });
    }
  });

  // Public exam access by code
  router.get("/public/exams/:code", async (req, res) => {
    const code = req.params.code;
    const exam = await storage.getExamByAccessCode(code);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    if (exam.status !== "active") {
      return res.status(403).json({ message: "Exam is not active" });
    }
    
    // Only return necessary exam info, not questions
    const examInfo = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      grade: exam.grade,
      duration: exam.duration
    };
    
    res.json(examInfo);
  });

  // Register API routes
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
