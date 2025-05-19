import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  X
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import ExamCard from "@/components/dashboard/ExamCard";
import CreateExamModal from "@/components/exam/CreateExamModal";
import ShareExamModal from "@/components/exam/ShareExamModal";
import PDFPreviewModal from "@/components/exam/PDFPreviewModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Exam, Question } from "@shared/schema";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Exams() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Modal states
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);
  const [isShareExamModalOpen, setIsShareExamModalOpen] = useState(false);
  const [isPDFPreviewModalOpen, setIsPDFPreviewModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedExamQuestions, setSelectedExamQuestions] = useState<Question[]>([]);
  
  // Fetch all exams
  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });
  
  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      await apiRequest("DELETE", `/api/exams/${examId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الاختبار بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error deleting exam:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الاختبار",
        variant: "destructive",
      });
    }
  });

  const handleCreateExam = async (examData: any) => {
    try {
      // First create the exam
      const response = await apiRequest("POST", "/api/exams", {
        title: examData.title,
        description: examData.description,
        subject: examData.subject,
        grade: examData.grade,
        duration: examData.duration,
        examDate: examData.examDate,
        status: examData.status,
        shuffleQuestions: examData.shuffleQuestions,
        showResults: examData.showResults,
        showCorrectAnswers: examData.showCorrectAnswers,
        allowReview: examData.allowReview
      });
      
      const newExam = await response.json();
      
      // Then create questions for the exam
      for (const question of examData.questions) {
        await apiRequest("POST", `/api/exams/${newExam.id}/questions`, {
          type: question.type,
          content: question.content,
          options: question.options,
          correctAnswer: question.correctAnswer,
          acceptedAnswers: question.acceptedAnswers,
          points: question.points,
          order: question.order
        });
      }
      
      toast({
        title: "تم إنشاء الاختبار",
        description: "تم إنشاء الاختبار بنجاح",
      });
      
      setIsCreateExamModalOpen(false);
      
      // Refresh exams list
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الاختبار",
        variant: "destructive",
      });
    }
  };

  const handleShareExam = async (examId: number) => {
    try {
      const exam = exams.find(e => e.id === examId);
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
      deleteExamMutation.mutate(examId);
    }
  };

  // Apply filters and sort
  const filteredExams = exams
    .filter(exam => {
      // Apply search filter
      const matchesSearch = 
        searchTerm === "" || 
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply status filter
      const matchesStatus = 
        statusFilter === "all" || 
        exam.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <Sidebar />
      
      <main className="md:pr-64 p-4 transition-all duration-200">
        {/* Page Header */}
        <header className="mb-6 mt-16 md:mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">الاختبارات</h1>
              <p className="text-muted-foreground">استعراض وإدارة الاختبارات</p>
            </div>
            <div className="mt-4 md:mt-0">
              <ButtonArabic 
                onClick={() => setIsCreateExamModalOpen(true)}
              >
                <Plus className="ml-2 h-4 w-4" />
                إنشاء اختبار جديد
              </ButtonArabic>
            </div>
          </div>
        </header>
        
        {/* Filter Bar */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث عن اختبار بالعنوان..."
              className="pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Input
              placeholder="البحث بواسطة رمز الاختبار..."
              className="pr-10 border-primary/30"
              onChange={(e) => {
                const code = e.target.value.trim();
                if (code) {
                  // If it's a code search, clear other filters
                  setSearchTerm("");
                  setStatusFilter("all");
                  // Look for an exact match on accessCode
                  const exam = exams.find(e => e.accessCode === code);
                  if (exam) {
                    setLocation(`/exam/${code}`);
                  }
                }
              }}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الاختبارات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="completed">منتهي</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <ArrowUpDown className="ml-2 h-4 w-4" />
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث أولاً</SelectItem>
              <SelectItem value="oldest">الأقدم أولاً</SelectItem>
              <SelectItem value="title">العنوان</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Applied Filters */}
        {(searchTerm || statusFilter !== "all" || sortBy !== "newest") && (
          <div className="mb-4 flex items-center">
            <span className="text-sm text-muted-foreground ml-2">الفلاتر المطبقة:</span>
            {searchTerm && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2 flex items-center">
                البحث: {searchTerm}
                <X className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setSearchTerm("")} />
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2 flex items-center">
                الحالة: {statusFilter === "active" ? "نشط" : statusFilter === "draft" ? "مسودة" : "منتهي"}
                <X className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setStatusFilter("all")} />
              </span>
            )}
            {sortBy !== "newest" && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2 flex items-center">
                الترتيب: {sortBy === "oldest" ? "الأقدم أولاً" : "العنوان"}
                <X className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setSortBy("newest")} />
              </span>
            )}
            <ButtonArabic
              variant="link"
              className="text-xs"
              onClick={clearFilters}
            >
              مسح الكل
            </ButtonArabic>
          </div>
        )}
        
        {/* Exams Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل الاختبارات...</p>
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map(exam => (
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
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            {exams.length === 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">لا توجد اختبارات بعد.</p>
                <ButtonArabic
                  onClick={() => setIsCreateExamModalOpen(true)}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  إنشاء اختبار جديد
                </ButtonArabic>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">لا توجد نتائج تطابق معايير البحث.</p>
                <ButtonArabic
                  variant="outline"
                  onClick={clearFilters}
                >
                  مسح الفلاتر
                </ButtonArabic>
              </div>
            )}
          </div>
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
