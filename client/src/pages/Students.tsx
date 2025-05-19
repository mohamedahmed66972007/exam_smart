import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  EyeIcon,
  FileText
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, ExamAttempt, Exam } from "@shared/schema";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface StudentWithStats {
  user: User;
  attempts: number;
  completedExams: number;
  averageScore: number;
  lastAttempt?: Date;
}

export default function Students() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 8;
  
  // Fetch all exam attempts to get student data
  const { data: attemptData = [], isLoading } = useQuery({
    queryKey: ['/api/exams/attempts/all'],
    queryFn: async () => {
      // This is a theoretical endpoint that would return all attempts with user data
      // For the purpose of the demo, we'll create mock data
      const mockStudents: User[] = Array(15).fill(0).map((_, i) => ({
        id: i + 2, // Starting from 2 since 1 is the teacher
        username: `student${i + 1}`,
        name: `طالب ${i + 1}`,
        email: `student${i + 1}@example.com`,
        role: "student",
        avatar: i % 3 === 0 ? `https://images.unsplash.com/photo-${1500000000000 + i}?crop=faces&fit=crop&w=128&h=128` : undefined,
        createdAt: new Date(2023, 0, i + 1)
      }));
      
      const mockAttempts: ExamAttempt[] = [];
      const mockExams: Exam[] = Array(5).fill(0).map((_, i) => ({
        id: i + 1,
        title: `اختبار ${i + 1}`,
        status: "active",
        createdBy: 1,
        duration: 60,
      } as Exam));
      
      // Create some mock attempts for each student
      mockStudents.forEach(student => {
        const attemptCount = Math.floor(Math.random() * 8) + 1; // 1-8 attempts
        
        for (let i = 0; i < attemptCount; i++) {
          const examId = Math.floor(Math.random() * 5) + 1;
          const score = Math.floor(Math.random() * 100);
          const completed = Math.random() > 0.2; // 80% complete
          
          mockAttempts.push({
            id: mockAttempts.length + 1,
            examId,
            userId: student.id,
            score: completed ? score : undefined,
            maxScore: 100,
            status: completed ? "completed" : "in-progress",
            startTime: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            endTime: completed ? new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : undefined
          });
        }
      });
      
      return { students: mockStudents, attempts: mockAttempts, exams: mockExams };
    }
  });
  
  // Process data to get student statistics
  const studentStats: StudentWithStats[] = attemptData?.students?.map(student => {
    const studentAttempts = attemptData.attempts.filter(attempt => attempt.userId === student.id);
    const completedAttempts = studentAttempts.filter(attempt => attempt.status === "completed");
    const scores = completedAttempts.map(attempt => attempt.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const lastAttempt = studentAttempts.length > 0 
      ? new Date(Math.max(...studentAttempts.map(a => a.startTime ? new Date(a.startTime).getTime() : 0)))
      : undefined;
    
    return {
      user: student,
      attempts: studentAttempts.length,
      completedExams: completedAttempts.length,
      averageScore,
      lastAttempt
    };
  }) || [];
  
  // Apply search filter
  const filteredStudents = studentStats.filter(student => 
    searchTerm === "" || 
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Apply pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  
  // Page navigation
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <Sidebar />
      
      <main className="md:pr-64 p-4 transition-all duration-200">
        {/* Page Header */}
        <header className="mb-6 mt-16 md:mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">الطلاب</h1>
              <p className="text-muted-foreground">مراقبة وإدارة الطلاب المسجلين في نظامك</p>
            </div>
            <div className="mt-4 md:mt-0">
              <ButtonArabic>
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة طالب
              </ButtonArabic>
            </div>
          </div>
        </header>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث عن طالب باسمه أو بريده الإلكتروني..."
              className="pr-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>
        
        {/* Students Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل بيانات الطلاب...</p>
          </div>
        ) : currentStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentStudents.map(student => (
              <Card key={student.user.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <Avatar className="ml-3 h-10 w-10">
                        <AvatarImage src={student.user.avatar} alt={student.user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {student.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{student.user.name}</h3>
                        <p className="text-xs text-muted-foreground">{student.user.username}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="ml-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{student.user.email}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <FileText className="ml-2 h-4 w-4 text-muted-foreground" />
                        <span>الاختبارات: {student.completedExams}/{student.attempts}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          آخر نشاط: {student.lastAttempt 
                            ? format(student.lastAttempt, "dd MMM yyyy", { locale: ar })
                            : "لا يوجد"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Badge className={`${
                        student.averageScore >= 80 ? "bg-success text-success-foreground" :
                        student.averageScore >= 60 ? "bg-secondary text-secondary-foreground" :
                        "bg-destructive text-destructive-foreground"
                      }`}>
                        متوسط الدرجات: {student.averageScore.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="border-t border-border p-3 bg-background flex justify-between">
                    <ButtonArabic
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/students/${student.user.id}`)}
                    >
                      <EyeIcon className="ml-1 h-4 w-4" />
                      عرض التفاصيل
                    </ButtonArabic>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <p className="text-muted-foreground">لا توجد نتائج تطابق معايير البحث.</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <ButtonArabic
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </ButtonArabic>
              
              {Array.from({ length: totalPages }).map((_, index) => (
                <ButtonArabic
                  key={index}
                  variant={currentPage === index + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </ButtonArabic>
              ))}
              
              <ButtonArabic
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronLeft className="h-4 w-4" />
              </ButtonArabic>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
