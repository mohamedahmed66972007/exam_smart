import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  BarChart2, 
  Download, 
  Share, 
  Edit, 
  Trash2, 
  Plus 
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import StatCard from "@/components/dashboard/StatCard";
import ExamCard from "@/components/dashboard/ExamCard";
import ResultsTable from "@/components/dashboard/ResultsTable";
import ReviewItem from "@/components/dashboard/ReviewItem";
import CreateExamModal from "@/components/exam/CreateExamModal";
import ShareExamModal from "@/components/exam/ShareExamModal";
import PDFPreviewModal from "@/components/exam/PDFPreviewModal";
import { FindExamByCode } from "@/components/exam/FindExamByCode";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Exam, Question } from "@shared/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Modal states
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);
  const [isShareExamModalOpen, setIsShareExamModalOpen] = useState(false);
  const [isPDFPreviewModalOpen, setIsPDFPreviewModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedExamQuestions, setSelectedExamQuestions] = useState<Question[]>([]);
  
  // Fetch dashboard stats
  const { data: stats = { examCount: 0, studentCount: 0, completedCount: 0, pendingCount: 0 } } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });
  
  // Fetch recent exams
  const { data: recentExams = [] } = useQuery<Exam[]>({
    queryKey: ['/api/dashboard/recent-exams'],
  });
  
  // Fetch recent results
  const { data: recentResultsData = [] } = useQuery({
    queryKey: ['/api/dashboard/recent-results'],
  });
  
  // Fetch review requests
  const { data: reviewRequestsData = [] } = useQuery({
    queryKey: ['/api/dashboard/review-requests'],
  });
  
  // Format recent results for display
  const recentResults = recentResultsData.map((result: any) => ({
    id: result.attempt.id,
    student: {
      id: result.user.id,
      name: result.user.name,
      avatar: result.user.avatar
    },
    exam: {
      id: result.exam.id,
      title: result.exam.title
    },
    score: result.attempt.score,
    maxScore: result.attempt.maxScore,
    duration: result.attempt.endTime && result.attempt.startTime 
      ? Math.floor((new Date(result.attempt.endTime).getTime() - new Date(result.attempt.startTime).getTime()) / 60000) 
      : 0,
    date: result.attempt.endTime ? new Date(result.attempt.endTime) : new Date()
  }));
  
  // Format review requests for display
  const reviewRequests = reviewRequestsData.map((request: any) => ({
    student: {
      id: request.user.id,
      name: request.user.name,
      avatar: request.user.avatar
    },
    exam: {
      id: request.exam.id,
      title: request.exam.title
    },
    question: {
      id: request.question.id,
      number: request.question.order,
      content: request.question.content
    },
    answer: request.answer.answer
  }));

  const handleCreateExam = async (examData: any) => {
    try {
      // تجهيز بيانات الاختبار
      const examPayload = {
        title: examData.title || "اختبار بدون عنوان",
        description: examData.description || null,
        subject: examData.subject || null,
        grade: examData.grade || null,
        duration: examData.duration || 60,
        status: examData.status || "active",
        shuffleQuestions: examData.shuffleQuestions || false,
        showResults: examData.showResults || true,
        showCorrectAnswers: examData.showCorrectAnswers || false,
        allowReview: examData.allowReview || true
      };
      
      console.log("إرسال بيانات الاختبار:", examPayload);
      
      // إنشاء الاختبار
      const response = await apiRequest("POST", "/api/exams", examPayload);
      
      const newExam = await response.json();
      console.log("تم إنشاء الاختبار:", newExam);
      
      // إنشاء الأسئلة للاختبار
      if (examData.questions && examData.questions.length > 0) {
        for (const question of examData.questions) {
          // تحضير بيانات السؤال
          const questionPayload = {
            type: question.type,
            content: question.content,
            points: question.points || 1,
            order: question.order || 1
          };
          
          // إضافة الخيارات للأسئلة متعددة الخيارات
          if (question.options) {
            questionPayload["options"] = question.options;
          }
          
          // إضافة الإجابة الصحيحة
          if (question.correctAnswer !== undefined) {
            questionPayload["correctAnswer"] = question.correctAnswer;
          }
          
          // إضافة الإجابات المقبولة للأسئلة المقالية
          if (question.acceptedAnswers) {
            questionPayload["acceptedAnswers"] = question.acceptedAnswers;
          }
          
          console.log(`إضافة سؤال للاختبار ${newExam.id}:`, questionPayload);
          
          await apiRequest("POST", `/api/exams/${newExam.id}/questions`, questionPayload);
        }
      }
      
      toast({
        title: "تم إنشاء الاختبار",
        description: "تم إنشاء الاختبار بنجاح",
      });
      
      setIsCreateExamModalOpen(false);
      
      // تحديث القائمة وإعادة التوجيه
      window.location.href = "/exams";
    } catch (error) {
      console.error("خطأ في إنشاء الاختبار:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الاختبار. تأكد من ملء جميع الحقول المطلوبة.",
        variant: "destructive",
      });
    }
  };

  const handleShareExam = async (examId: number) => {
    try {
      const exam = recentExams.find(e => e.id === examId);
      if (exam) {
        setSelectedExam(exam);
        setIsShareExamModalOpen(true);
      }
    } catch (error) {
      console.error("Error sharing exam:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مشاركة الاختبار",
        variant: "destructive",
      });
    }
  };

  const handleExportExam = async (examId: number) => {
    try {
      const examResponse = await apiRequest("GET", `/api/exams/${examId}`);
      const examData = await examResponse.json();
      
      setSelectedExam(examData.exam);
      setSelectedExamQuestions(examData.questions);
      setIsPDFPreviewModalOpen(true);
    } catch (error) {
      console.error("Error exporting exam:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير الاختبار",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExam = async (examId: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الاختبار؟")) {
      try {
        await apiRequest("DELETE", `/api/exams/${examId}`);
        
        toast({
          title: "تم الحذف",
          description: "تم حذف الاختبار بنجاح",
        });
        
        // Refresh queries
        window.location.reload();
      } catch (error) {
        console.error("Error deleting exam:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حذف الاختبار",
          variant: "destructive",
        });
      }
    }
  };

  const handleReviewAnswer = async (questionId: number, answerId: number, accepted: boolean) => {
    try {
      await apiRequest("PUT", `/api/answers/${answerId}`, {
        reviewed: true,
        score: accepted ? 5 : 0, // Assuming essay questions are worth 5 points
        reviewComment: accepted ? "تم قبول الإجابة" : "تم رفض الإجابة"
      });
      
      toast({
        title: accepted ? "تم قبول الإجابة" : "تم رفض الإجابة",
        description: "تم تحديث حالة المراجعة بنجاح",
      });
      
      // Refresh review requests
      window.location.reload();
    } catch (error) {
      console.error("Error reviewing answer:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مراجعة الإجابة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <Sidebar />
      
      <main className="md:pr-64 p-4 transition-all duration-200">
        {/* Dashboard Header */}
        <header className="mb-6 mt-16 md:mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              <p className="text-muted-foreground">مرحباً بك، يمكنك إنشاء وإدارة الاختبارات من هنا</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                className="btn-primary"
                onClick={() => setIsCreateExamModalOpen(true)}
              >
                <Plus className="ml-2 h-4 w-4" />
                إنشاء اختبار جديد
              </button>
            </div>
          </div>
        </header>
        
        {/* Stats & Exam Search */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              <StatCard
                title="الاختبارات"
                value={stats.examCount}
                icon={<FileText />}
              />
              <StatCard
                title="مكتملة"
                value={stats.completedCount}
                icon={<CheckCircle />}
                iconClass="text-success"
                iconBgClass="bg-success-50 dark:bg-success-900/20"
              />
              <StatCard
                title="قيد الانتظار"
                value={stats.pendingCount}
                icon={<Clock />}
                iconClass="text-destructive"
                iconBgClass="bg-destructive-50 dark:bg-destructive-900/20"
              />
            </div>
          </div>
          <div>
            <FindExamByCode />
          </div>
        </section>
        
        {/* Recent Exams */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">الاختبارات المنشورة</h2>
            <Link href="/exams">
              <a className="text-primary hover:underline text-sm">عرض الكل</a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentExams.map(exam => (
              <ExamCard 
                key={exam.id}
                exam={exam}
                onDelete={handleDeleteExam}
                onEdit={(id) => setLocation(`/exams/edit/${id}`)}
                onShare={handleShareExam}
                onStats={(id) => setLocation(`/exams/stats/${id}`)}
                onExport={handleExportExam}
              />
            ))}
            
            {recentExams.length === 0 && (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                لا توجد اختبارات بعد. قم بإنشاء اختبار جديد.
              </div>
            )}
          </div>
        </section>
        
        {/* Recent Results */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">آخر النتائج</h2>
            <Link href="/results">
              <a className="text-primary hover:underline text-sm">عرض الكل</a>
            </Link>
          </div>
          
          {recentResults.length > 0 ? (
            <ResultsTable
              results={recentResults}
              onView={(id) => setLocation(`/exam-result/${id}`)}
              onDownload={(id) => setLocation(`/exam-result/${id}?download=true`)}
            />
          ) : (
            <div className="bg-card rounded-lg shadow p-8 text-center">
              <p className="text-muted-foreground">لم تقم بإجراء أي اختبارات بعد.</p>
            </div>
          )}
        </section>
        
        {/* Pending Review - Only show if there are items to review */}
        {reviewRequests.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">إجابات تحتاج للمراجعة</h2>
              <span className="bg-destructive-50 dark:bg-destructive-900/20 text-destructive px-2 py-1 rounded-full text-sm">
                {reviewRequests.length} {reviewRequests.length === 1 ? 'إجابة' : 'إجابات'}
              </span>
            </div>
            
            <div className="bg-card rounded-lg shadow p-4">
              <div className="space-y-4">
                {reviewRequests.map((request, index) => (
                  <ReviewItem
                    key={index}
                    student={request.student}
                    exam={request.exam}
                    question={request.question}
                    answer={request.answer}
                    onAccept={(questionId, answerId) => 
                      handleReviewAnswer(questionId, answerId, true)
                    }
                    onReject={(questionId, answerId) => 
                      handleReviewAnswer(questionId, answerId, false)
                    }
                  />
                ))}
              </div>
              
              {reviewRequests.length > 2 && (
                <div className="mt-4 text-center">
                  <Link href="/results?filter=review">
                    <a className="text-primary hover:underline text-sm">عرض المزيد</a>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      
      {/* Modals */}
      <CreateExamModal
        isOpen={isCreateExamModalOpen}
        onClose={() => setIsCreateExamModalOpen(false)}
        onCreateExam={handleCreateExam}
        onSaveDraft={(data) => handleCreateExam({ ...data, status: "draft" })}
      />
      
      {selectedExam && (
        <>
          <ShareExamModal
            isOpen={isShareExamModalOpen}
            onClose={() => setIsShareExamModalOpen(false)}
            examId={selectedExam.id}
            examTitle={selectedExam.title}
            examCode={selectedExam.accessCode || "EXAMCODE"}
            examLink={`${window.location.origin}/exam/${selectedExam.accessCode}`}
          />
          
          {selectedExamQuestions.length > 0 && (
            <PDFPreviewModal
              isOpen={isPDFPreviewModalOpen}
              onClose={() => setIsPDFPreviewModalOpen(false)}
              exam={selectedExam}
              questions={selectedExamQuestions}
            />
          )}
        </>
      )}
    </div>
  );
}
