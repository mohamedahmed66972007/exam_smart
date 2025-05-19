import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Filter,
  Download, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  CalendarIcon,
  Clock,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import ReviewItem from "@/components/dashboard/ReviewItem";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatDuration } from "@/lib/exam-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for filtering and pagination
  const [activeTab, setActiveTab] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  
  // Fetch all exams for filter dropdown
  const { data: exams = [] } = useQuery({
    queryKey: ['/api/exams'],
  });
  
  // Fetch all exam attempts with related data
  const { data: attemptsData = [], isLoading } = useQuery({
    queryKey: ['/api/dashboard/results/all'],
    queryFn: async () => {
      // Mocking the data for the demo
      // In a real app, you would fetch this from your API
      const mockResults = [];
      
      // Creates 25 results for demo
      for (let i = 0; i < 25; i++) {
        const examId = (i % 5) + 1;
        const studentId = (i % 15) + 2; // 2-16 for students
        const score = Math.floor(Math.random() * 100);
        const duration = Math.floor(Math.random() * 60) + 15; // 15-75 minutes
        const reviewNeeded = i % 7 === 0; // Some need review
        
        mockResults.push({
          id: i + 1,
          examId,
          exam: {
            id: examId,
            title: `اختبار ${examId} - ${i < 10 ? 'الرياضيات' : i < 15 ? 'العلوم' : i < 20 ? 'اللغة العربية' : 'اللغة الإنجليزية'}`,
            subject: i < 10 ? 'الرياضيات' : i < 15 ? 'العلوم' : i < 20 ? 'اللغة العربية' : 'اللغة الإنجليزية',
          },
          userId: studentId,
          user: {
            id: studentId,
            name: `طالب ${studentId - 1}`,
            username: `student${studentId - 1}`,
            avatar: studentId % 3 === 0 ? `https://images.unsplash.com/photo-${1500000000000 + studentId}?crop=faces&fit=crop&w=128&h=128` : undefined,
          },
          score,
          maxScore: 100,
          duration,
          date: new Date(2023, Math.floor(i / 10) + 1, (i % 28) + 1),
          status: score < 60 ? 'failed' : 'passed',
          needsReview: reviewNeeded,
          reviewItems: reviewNeeded ? [{
            questionId: i + 100,
            questionNumber: 3,
            questionContent: "اشرح مفهوم الاشتقاق في الرياضيات مع ذكر أمثلة.",
            answer: "الاشتقاق هو معدل التغير اللحظي لدالة. مثلا اشتقاق س² = ٢س."
          }] : []
        });
      }
      
      return mockResults;
    }
  });
  
  // Apply filters
  const filteredResults = attemptsData.filter(result => {
    // Filter by tab
    if (activeTab === "review" && !result.needsReview) return false;
    if (activeTab === "passed" && result.status !== "passed") return false;
    if (activeTab === "failed" && result.status !== "failed") return false;
    
    // Filter by exam
    if (examFilter !== "all" && result.examId !== parseInt(examFilter)) return false;
    
    return true;
  });
  
  // Apply pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredResults.slice(indexOfFirstResult, indexOfLastResult);
  
  // Page navigation
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Review handlers
  const handleAcceptAnswer = (questionId: number, userId: number) => {
    toast({
      title: "تم قبول الإجابة",
      description: "تم تحديث حالة المراجعة بنجاح"
    });
    // In a real app, you would make an API request here
  };

  const handleRejectAnswer = (questionId: number, userId: number) => {
    toast({
      title: "تم رفض الإجابة",
      description: "تم تحديث حالة المراجعة بنجاح"
    });
    // In a real app, you would make an API request here
  };

  const handleViewResult = (resultId: number) => {
    setLocation(`/exam-result/${resultId}`);
  };

  const handleDownloadResult = (resultId: number) => {
    toast({
      title: "جاري التنزيل",
      description: "جاري تنزيل نتيجة الاختبار"
    });
    // In a real app, you would trigger a download here
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-success text-success-foreground">{score}%</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-secondary text-secondary-foreground">{score}%</Badge>;
    } else {
      return <Badge className="bg-destructive text-destructive-foreground">{score}%</Badge>;
    }
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
              <h1 className="text-2xl font-bold">النتائج</h1>
              <p className="text-muted-foreground">عرض وتحليل نتائج الاختبارات</p>
            </div>
            <div className="mt-4 md:mt-0">
              <ButtonArabic
                variant="outline"
                onClick={() => {
                  toast({
                    title: "جاري التصدير",
                    description: "جاري تصدير جميع النتائج إلى ملف Excel"
                  });
                }}
              >
                <Download className="ml-2 h-4 w-4" />
                تصدير النتائج
              </ButtonArabic>
            </div>
          </div>
        </header>
        
        {/* Filters and Tabs */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">جميع النتائج</TabsTrigger>
              <TabsTrigger value="passed">الناجحون</TabsTrigger>
              <TabsTrigger value="failed">الراسبون</TabsTrigger>
              <TabsTrigger value="review">تحتاج مراجعة</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="w-full md:w-64">
            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger>
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue placeholder="تصفية حسب الاختبار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الاختبارات</SelectItem>
                {exams.map((exam: any) => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Results Content */}
        <Tabs value={activeTab}>
            <TabsContent value="all" className="mt-0">
                <div className="bg-card rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">الرقم</TableHead>
                                    <TableHead>الطالب</TableHead>
                                    <TableHead>الاختبار</TableHead>
                                    <TableHead>الدرجة</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>المدة</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : currentResults.length > 0 ? (
                                    currentResults.map((result, index) => (
                                        <TableRow key={result.id}>
                                            <TableCell>{indexOfFirstResult + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Avatar className="ml-2 h-8 w-8">
                                                        <AvatarImage src={result.user.avatar} alt={result.user.name} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {result.user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{result.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{result.user.username}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p>{result.exam.title}</p>
                                                    <p className="text-xs text-muted-foreground">{result.exam.subject}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getScoreBadge(result.score)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <CalendarIcon className="ml-1 h-4 w-4 text-muted-foreground" />
                                                    <span>{format(result.date, "dd MMM yyyy", { locale: ar })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Clock className="ml-1 h-4 w-4 text-muted-foreground" />
                                                    <span>{formatDuration(result.duration)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <ButtonArabic
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewResult(result.id)}
                                                    >
                                                        <Eye className="ml-1 h-4 w-4" />
                                                        عرض
                                                    </ButtonArabic>
                                                    <ButtonArabic
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownloadResult(result.id)}
                                                    >
                                                        <Download className="ml-1 h-4 w-4" />
                                                        تنزيل
                                                    </ButtonArabic>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-muted-foreground">لا توجد نتائج تطابق معايير البحث.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="passed" className="mt-0">
                <div className="bg-card rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">الرقم</TableHead>
                                    <TableHead>الطالب</TableHead>
                                    <TableHead>الاختبار</TableHead>
                                    <TableHead>الدرجة</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>المدة</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : currentResults.length > 0 ? (
                                    currentResults.map((result, index) => (
                                        <TableRow key={result.id}>
                                            <TableCell>{indexOfFirstResult + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Avatar className="ml-2 h-8 w-8">
                                                        <AvatarImage src={result.user.avatar} alt={result.user.name} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {result.user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{result.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{result.user.username}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p>{result.exam.title}</p>
                                                    <p className="text-xs text-muted-foreground">{result.exam.subject}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getScoreBadge(result.score)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <CalendarIcon className="ml-1 h-4 w-4 text-muted-foreground" />
                                                    <span>{format(result.date, "dd MMM yyyy", { locale: ar })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Clock className="ml-1 h-4 w-4 text-muted-foreground" />
                                                    <span>{formatDuration(result.duration)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <ButtonArabic
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewResult(result.id)}
                                                    >
                                                        <Eye className="ml-1 h-4 w-4" />
                                                        عرض
                                                    </ButtonArabic>
                                                    <ButtonArabic
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownloadResult(result.id)}
                                                    >
                                                        <Download className="ml-1 h-4 w-4" />
                                                        تنزيل
                                                    </ButtonArabic>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-muted-foreground">لا توجد نتائج تطابق معايير البحث.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="failed" className="mt-0">
                <div className="bg-card rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">الرقم</TableHead>
                                    <TableHead>الطالب</TableHead>
                                    <TableHead>الاختبار</TableHead>
                                    <TableHead>الدرجة</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>المدة</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : currentResults.length > 0 ? (
                                    currentResults.map((result, index) => (
                                        <TableRow key={result.id}>
                                            <TableCell>{indexOfFirstResult + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Avatar className="ml-2 h-8 w-8">
                                                        <AvatarImage src={result.user.avatar} alt={result.user.name} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {result.user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{result.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{result.user.username}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p>{result.exam.title}</p>
                                                    <p className="text-xs text-muted-foreground">{result.exam.subject}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getScoreBadge(result.score)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <CalendarIcon className="ml-1 h-4 w-4 text-muted-foreground" />
                                                    <span>{format(result.date, "dd MMM yyyy", { locale: ar })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Clock className="ml-1 h-4 w-4 text-muted-foreground" />
                                                    <span>{formatDuration(result.duration)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <ButtonArabic
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewResult(result.id)}
                                                    >
                                                        <Eye className="ml-1 h-4 w-4" />
                                                        عرض
                                                    </ButtonArabic>
                                                    <ButtonArabic
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownloadResult(result.id)}
                                                    >
                                                        <Download className="ml-1 h-4 w-4" />
                                                        تنزيل
                                                    </ButtonArabic>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-muted-foreground">لا توجد نتائج تطابق معايير البحث.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="review" className="mt-0">
                <div className="space-y-4">
                    {currentResults.filter(result => result.needsReview).map(result => (
                        result.reviewItems.map((item, index) => (
                            <ReviewItem
                                key={`${result.id}-${index}`}
                                student={result.user}
                                exam={result.exam}
                                question={{
                                    id: item.questionId,
                                    number: item.questionNumber,
                                    content: item.questionContent
                                }}
                                answer={item.answer}
                                onAccept={handleAcceptAnswer}
                                onReject={handleRejectAnswer}
                            />
                        ))
                    ))}
                    
                    {!isLoading && currentResults.filter(result => result.needsReview).length === 0 && (
                        <div className="text-center py-8 bg-card rounded-lg shadow">
                            <p className="text-muted-foreground">لا توجد إجابات تحتاج إلى مراجعة.</p>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
        
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
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                // Show first page, last page, current page, and pages around current
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                  if (index === 4) pageNumber = totalPages;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                  if (index === 0) pageNumber = 1;
                } else {
                  pageNumber = currentPage - 2 + index;
                  if (index === 0) pageNumber = 1;
                  if (index === 4) pageNumber = totalPages;
                }
                
                // Add ellipsis
                if ((totalPages > 5 && index === 1 && pageNumber !== 2) || 
                    (totalPages > 5 && index === 3 && pageNumber !== totalPages - 1)) {
                  return (
                    <span key={index} className="px-2 text-muted-foreground">...</span>
                  );
                }
                
                return (
                  <ButtonArabic
                    key={index}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => paginate(pageNumber)}
                  >
                    {pageNumber}
                  </ButtonArabic>
                );
              })}
              
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
