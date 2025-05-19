import { 
  User, InsertUser, 
  Exam, InsertExam, 
  Question, InsertQuestion, 
  Attachment, InsertAttachment, 
  ExamAttempt, InsertExamAttempt, 
  UserAnswer, InsertUserAnswer 
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Exam methods
  getExam(id: number): Promise<Exam | undefined>;
  getExamByAccessCode(accessCode: string): Promise<Exam | undefined>;
  getExamsByUser(userId: number): Promise<Exam[]>;
  getExamWithQuestions(id: number): Promise<{exam: Exam, questions: Question[]} | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Question methods
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByExam(examId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Attachment methods
  getAttachment(id: number): Promise<Attachment | undefined>;
  getAttachmentsByExam(examId: number): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: number): Promise<boolean>;
  
  // Exam attempt methods
  getExamAttempt(id: number): Promise<ExamAttempt | undefined>;
  getExamAttemptsByExam(examId: number): Promise<ExamAttempt[]>;
  getExamAttemptsByUser(userId: number): Promise<ExamAttempt[]>;
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  updateExamAttempt(id: number, attempt: Partial<ExamAttempt>): Promise<ExamAttempt | undefined>;
  
  // User answer methods
  getUserAnswer(id: number): Promise<UserAnswer | undefined>;
  getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]>;
  createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;
  updateUserAnswer(id: number, answer: Partial<UserAnswer>): Promise<UserAnswer | undefined>;
  
  // Dashboard methods
  getStats(userId: number): Promise<{
    examCount: number;
    studentCount: number;
    completedCount: number;
    pendingCount: number;
  }>;
  getRecentExams(userId: number, limit?: number): Promise<Exam[]>;
  getRecentResults(userId: number, limit?: number): Promise<{
    attempt: ExamAttempt;
    exam: Exam;
    user: User;
  }[]>;
  getReviewRequests(teacherId: number, limit?: number): Promise<{
    question: Question;
    answer: UserAnswer;
    user: User;
    exam: Exam;
  }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private exams: Map<number, Exam>;
  private questions: Map<number, Question>;
  private attachments: Map<number, Attachment>;
  private examAttempts: Map<number, ExamAttempt>;
  private userAnswers: Map<number, UserAnswer>;
  
  private userIdCounter: number;
  private examIdCounter: number;
  private questionIdCounter: number;
  private attachmentIdCounter: number;
  private attemptIdCounter: number;
  private answerIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.attachments = new Map();
    this.examAttempts = new Map();
    this.userAnswers = new Map();
    
    this.userIdCounter = 1;
    this.examIdCounter = 1;
    this.questionIdCounter = 1;
    this.attachmentIdCounter = 1;
    this.attemptIdCounter = 1;
    this.answerIdCounter = 1;
    
    // Add sample user
    this.createUser({
      username: "demo",
      password: "password",
      name: "د. محمد أحمد",
      email: "demo@example.com",
      role: "teacher",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Exam methods
  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }
  
  async getExamByAccessCode(accessCode: string): Promise<Exam | undefined> {
    return Array.from(this.exams.values()).find(exam => exam.accessCode === accessCode);
  }
  
  async getExamsByUser(userId: number): Promise<Exam[]> {
    return Array.from(this.exams.values())
      .filter(exam => exam.createdBy === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async getExamWithQuestions(id: number): Promise<{exam: Exam, questions: Question[]} | undefined> {
    const exam = await this.getExam(id);
    
    if (!exam) return undefined;
    
    const questions = await this.getQuestionsByExam(id);
    
    return { exam, questions };
  }
  
  async createExam(exam: InsertExam): Promise<Exam> {
    const id = this.examIdCounter++;
    const accessCode = nanoid(6).toUpperCase();
    
    const newExam: Exam = {
      ...exam,
      id,
      accessCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.exams.set(id, newExam);
    return newExam;
  }
  
  async updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined> {
    const existingExam = this.exams.get(id);
    
    if (!existingExam) return undefined;
    
    const updatedExam: Exam = {
      ...existingExam,
      ...exam,
      updatedAt: new Date()
    };
    
    this.exams.set(id, updatedExam);
    return updatedExam;
  }
  
  async deleteExam(id: number): Promise<boolean> {
    // Delete all related questions, attachments, attempts, and answers
    const questions = await this.getQuestionsByExam(id);
    for (const question of questions) {
      await this.deleteQuestion(question.id);
    }
    
    const attachments = await this.getAttachmentsByExam(id);
    for (const attachment of attachments) {
      await this.deleteAttachment(attachment.id);
    }
    
    const attempts = await this.getExamAttemptsByExam(id);
    for (const attempt of attempts) {
      const answers = await this.getUserAnswersByAttempt(attempt.id);
      for (const answer of answers) {
        this.userAnswers.delete(answer.id);
      }
      this.examAttempts.delete(attempt.id);
    }
    
    return this.exams.delete(id);
  }
  
  // Question methods
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.examId === examId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const newQuestion: Question = { ...question, id };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  async updateQuestion(id: number, question: Partial<Question>): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(id);
    
    if (!existingQuestion) return undefined;
    
    const updatedQuestion: Question = { ...existingQuestion, ...question };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  // Attachment methods
  async getAttachment(id: number): Promise<Attachment | undefined> {
    return this.attachments.get(id);
  }
  
  async getAttachmentsByExam(examId: number): Promise<Attachment[]> {
    return Array.from(this.attachments.values())
      .filter(attachment => attachment.examId === examId);
  }
  
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const id = this.attachmentIdCounter++;
    const newAttachment: Attachment = { 
      ...attachment, 
      id,
      createdAt: new Date()
    };
    this.attachments.set(id, newAttachment);
    return newAttachment;
  }
  
  async deleteAttachment(id: number): Promise<boolean> {
    return this.attachments.delete(id);
  }
  
  // Exam attempt methods
  async getExamAttempt(id: number): Promise<ExamAttempt | undefined> {
    return this.examAttempts.get(id);
  }
  
  async getExamAttemptsByExam(examId: number): Promise<ExamAttempt[]> {
    return Array.from(this.examAttempts.values())
      .filter(attempt => attempt.examId === examId)
      .sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));
  }
  
  async getExamAttemptsByUser(userId: number): Promise<ExamAttempt[]> {
    return Array.from(this.examAttempts.values())
      .filter(attempt => attempt.userId === userId)
      .sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));
  }
  
  async createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt> {
    const id = this.attemptIdCounter++;
    const newAttempt: ExamAttempt = {
      ...attempt,
      id,
      startTime: new Date()
    };
    this.examAttempts.set(id, newAttempt);
    return newAttempt;
  }
  
  async updateExamAttempt(id: number, attempt: Partial<ExamAttempt>): Promise<ExamAttempt | undefined> {
    const existingAttempt = this.examAttempts.get(id);
    
    if (!existingAttempt) return undefined;
    
    const updatedAttempt: ExamAttempt = { ...existingAttempt, ...attempt };
    this.examAttempts.set(id, updatedAttempt);
    return updatedAttempt;
  }
  
  // User answer methods
  async getUserAnswer(id: number): Promise<UserAnswer | undefined> {
    return this.userAnswers.get(id);
  }
  
  async getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]> {
    return Array.from(this.userAnswers.values())
      .filter(answer => answer.attemptId === attemptId);
  }
  
  async createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer> {
    const id = this.answerIdCounter++;
    const newAnswer: UserAnswer = { ...answer, id };
    this.userAnswers.set(id, newAnswer);
    return newAnswer;
  }
  
  async updateUserAnswer(id: number, answer: Partial<UserAnswer>): Promise<UserAnswer | undefined> {
    const existingAnswer = this.userAnswers.get(id);
    
    if (!existingAnswer) return undefined;
    
    const updatedAnswer: UserAnswer = { ...existingAnswer, ...answer };
    this.userAnswers.set(id, updatedAnswer);
    return updatedAnswer;
  }
  
  // Dashboard methods
  async getStats(userId: number): Promise<{
    examCount: number;
    studentCount: number;
    completedCount: number;
    pendingCount: number;
  }> {
    const userExams = await this.getExamsByUser(userId);
    const examIds = userExams.map(exam => exam.id);
    
    const attempts = Array.from(this.examAttempts.values())
      .filter(attempt => examIds.includes(attempt.examId));
    
    const studentIds = [...new Set(attempts.map(attempt => attempt.userId))];
    
    const completedAttempts = attempts.filter(attempt => attempt.status === 'completed');
    const pendingAttempts = attempts.filter(attempt => attempt.status === 'in-progress');
    
    return {
      examCount: userExams.length,
      studentCount: studentIds.length,
      completedCount: completedAttempts.length,
      pendingCount: pendingAttempts.length
    };
  }
  
  async getRecentExams(userId: number, limit: number = 3): Promise<Exam[]> {
    const userExams = await this.getExamsByUser(userId);
    return userExams.slice(0, limit);
  }
  
  async getRecentResults(userId: number, limit: number = 4): Promise<{
    attempt: ExamAttempt;
    exam: Exam;
    user: User;
  }[]> {
    const userExams = await this.getExamsByUser(userId);
    const examIds = userExams.map(exam => exam.id);
    
    const allAttempts = Array.from(this.examAttempts.values())
      .filter(attempt => examIds.includes(attempt.examId) && attempt.status === 'completed')
      .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0));
    
    const results = [];
    
    for (const attempt of allAttempts) {
      const exam = userExams.find(e => e.id === attempt.examId);
      const user = this.users.get(attempt.userId);
      
      if (exam && user) {
        results.push({ attempt, exam, user });
      }
      
      if (results.length >= limit) break;
    }
    
    return results;
  }
  
  async getReviewRequests(teacherId: number, limit: number = 5): Promise<{
    question: Question;
    answer: UserAnswer;
    user: User;
    exam: Exam;
  }[]> {
    const userExams = await this.getExamsByUser(teacherId);
    const examIds = userExams.map(exam => exam.id);
    
    const allAnswersNeedingReview = Array.from(this.userAnswers.values())
      .filter(answer => answer.reviewRequested);
    
    const results = [];
    
    for (const answer of allAnswersNeedingReview) {
      const attempt = this.examAttempts.get(answer.attemptId);
      
      if (!attempt || !examIds.includes(attempt.examId)) continue;
      
      const question = this.questions.get(answer.questionId);
      const user = this.users.get(attempt.userId);
      const exam = userExams.find(e => e.id === attempt.examId);
      
      if (question && user && exam) {
        results.push({ question, answer, user, exam });
      }
      
      if (results.length >= limit) break;
    }
    
    return results;
  }

  // Add sample data for demo purposes
  initializeSampleData() {
    // Add sample students
    const student1 = this.createUser({
      username: "student1",
      password: "password",
      name: "أحمد محمود",
      email: "student1@example.com",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    });

    const student2 = this.createUser({
      username: "student2",
      password: "password",
      name: "سارة عبدالله",
      email: "student2@example.com",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    });

    // Add more students
    const student3 = this.createUser({
      username: "student3",
      password: "password",
      name: "محمد علي",
      email: "student3@example.com",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    });

    const student4 = this.createUser({
      username: "student4",
      password: "password",
      name: "فاطمة خالد",
      email: "student4@example.com",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    });

    const student5 = this.createUser({
      username: "student5",
      password: "password",
      name: "عمر حسن",
      email: "student5@example.com",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    });

    // Create sample exams
    this.createExam({
      title: "اختبار الرياضيات النهائي",
      description: "الصف الثالث الثانوي - الفصل الثاني",
      subject: "الرياضيات",
      grade: "الصف الثالث الثانوي",
      duration: 45,
      createdBy: 1,
      status: "active",
      examDate: new Date("2023-05-15"),
      shuffleQuestions: false,
      showResults: true,
      showCorrectAnswers: false,
      allowReview: true
    }).then(exam => {
      // Add questions to the exam
      this.createQuestion({
        examId: exam.id,
        type: "multiple-choice",
        content: "ما هو ناتج 25 × 4 ؟",
        options: ["50", "75", "100", "125"],
        correctAnswer: "100",
        points: 2,
        order: 1
      });

      this.createQuestion({
        examId: exam.id,
        type: "multiple-choice",
        content: "أي مما يلي يمثل معادلة الخط المستقيم؟",
        options: ["y = x²", "y = mx + c", "y = 1/x", "y = sin(x)"],
        correctAnswer: "y = mx + c",
        points: 2,
        order: 2
      });

      this.createQuestion({
        examId: exam.id,
        type: "true-false",
        content: "الماء مركب كيميائي يتكون من ذرتي هيدروجين وذرة أكسجين.",
        correctAnswer: true,
        points: 1,
        order: 3
      });

      this.createQuestion({
        examId: exam.id,
        type: "true-false",
        content: "مجموع زوايا المثلث يساوي 180 درجة.",
        correctAnswer: true,
        points: 1,
        order: 4
      });

      this.createQuestion({
        examId: exam.id,
        type: "essay",
        content: "اشرح نظرية فيثاغورس واذكر تطبيقاً عملياً لها.",
        correctAnswer: null,
        acceptedAnswers: [
          "نظرية فيثاغورس تنص على أن مربع طول الوتر في المثلث القائم الزاوية يساوي مجموع مربعي طولي الضلعين الآخرين. من تطبيقاتها حساب المسافات وتحديد ما إذا كان المثلث قائم الزاوية.",
          "تنص نظرية فيثاغورس على أن: في المثلث القائم الزاوية، مربع طول الوتر يساوي مجموع مربعي طولي الضلعين الآخرين. يمكن استخدامها في الهندسة المعمارية لضمان أن الزوايا قائمة."
        ],
        points: 5,
        order: 5
      });

      // Create student attempts for the exam
      this.createExamAttempt({
        examId: exam.id,
        userId: 2,
        score: 46,
        maxScore: 50,
        status: "completed",
        endTime: new Date("2023-05-15T10:38:00")
      });

      this.createExamAttempt({
        examId: exam.id,
        userId: 3,
        score: 44,
        maxScore: 50,
        status: "completed",
        endTime: new Date("2023-05-15T10:42:00")
      });

      this.createExamAttempt({
        examId: exam.id,
        userId: 4,
        score: 33,
        maxScore: 50,
        status: "completed",
        endTime: new Date("2023-05-15T10:45:00")
      });
    });

    // Create a sample physics exam
    this.createExam({
      title: "اختبار نصف الترم - فيزياء",
      description: "الصف الثاني الثانوي - الفصل الأول",
      subject: "الفيزياء",
      grade: "الصف الثاني الثانوي",
      duration: 60,
      createdBy: 1,
      status: "draft",
      shuffleQuestions: true,
      showResults: true,
      showCorrectAnswers: true,
      allowReview: true
    }).then(exam => {
      // Add questions to the exam
      this.createQuestion({
        examId: exam.id,
        type: "multiple-choice",
        content: "ما هي وحدة قياس القوة في النظام الدولي للوحدات؟",
        options: ["كيلوغرام", "نيوتن", "جول", "واط"],
        correctAnswer: "نيوتن",
        points: 2,
        order: 1
      });

      this.createQuestion({
        examId: exam.id,
        type: "multiple-choice",
        content: "ما هو مقدار التسارع الناتج عن تأثير قوة مقدارها 10 نيوتن على جسم كتلته 2 كيلوغرام؟",
        options: ["2 م/ث²", "5 م/ث²", "10 م/ث²", "20 م/ث²"],
        correctAnswer: "5 م/ث²",
        points: 2,
        order: 2
      });

      this.createQuestion({
        examId: exam.id,
        type: "essay",
        content: "اشرح قانون نيوتن الثاني للحركة وتطبيقاته.",
        correctAnswer: null,
        acceptedAnswers: [
          "ينص قانون نيوتن الثاني على أن: القوة المؤثرة على جسم تساوي حاصل ضرب كتلته في تسارعه (F = m × a). من تطبيقاته حساب القوة اللازمة لتحريك الأجسام بتسارع معين."
        ],
        points: 5,
        order: 3
      });
    });

    // Create a sample Arabic exam
    this.createExam({
      title: "اختبار اللغة العربية",
      description: "الصف الأول الثانوي - الفصل الثاني",
      subject: "اللغة العربية",
      grade: "الصف الأول الثانوي",
      duration: 90,
      createdBy: 1,
      status: "completed",
      examDate: new Date("2023-04-10"),
      shuffleQuestions: false,
      showResults: true,
      showCorrectAnswers: false,
      allowReview: true
    }).then(exam => {
      // Create student attempt
      this.createExamAttempt({
        examId: exam.id,
        userId: 5,
        score: 95,
        maxScore: 100,
        status: "completed",
        endTime: new Date("2023-04-10T10:80:00")
      });
    });

    // Create review requests
    this.createExamAttempt({
      examId: 2,
      userId: 6,
      status: "completed",
      score: 18,
      maxScore: 25,
      endTime: new Date()
    }).then(attempt => {
      this.createUserAnswer({
        attemptId: attempt.id,
        questionId: 8,
        answer: "القوة تساوي كتلة الجسم مضروبة في تسارعه، وكلما زادت القوة المؤثرة على الجسم زاد تسارعه. من تطبيقاته حساب قوة الدفع اللازمة لتحريك سيارة.",
        reviewRequested: true,
        reviewed: false,
        isCorrect: false,
        score: 0
      });
    });

    this.createExamAttempt({
      examId: 1,
      userId: 3,
      status: "completed",
      score: 43,
      maxScore: 50,
      endTime: new Date()
    }).then(attempt => {
      this.createUserAnswer({
        attemptId: attempt.id,
        questionId: 5,
        answer: "عملية كيميائية حيوية تحدث في النباتات حيث تقوم بتحويل ثاني أكسيد الكربون والماء إلى جلوكوز وأكسجين باستخدام ضوء الشمس، وتتم في البلاستيدات الخضراء.",
        reviewRequested: true,
        reviewed: false,
        isCorrect: false,
        score: 0
      });
    });
  }
}

export const storage = new MemStorage();
storage.initializeSampleData();
