import React, { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF } from "@/lib/export-pdf";
import { exportToWord } from "@/lib/export-word";
import { formatDuration, formatGrade } from "@/lib/exam-utils";
import { ButtonArabic } from "@/components/ui/button-arabic";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

interface ResultParams {
  id: string;
}

export default function ExamResult() {
  const { id } = useParams<ResultParams>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Fetch attempt data
  const { data: attemptData, isLoading: attemptLoading } = useQuery({
    queryKey: [`/api/attempts/${id}`],
    enabled: !!id,
  });
  
  // Fetch exam data
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: [`/api/exams/${attemptData?.examId}`],
    enabled: !!attemptData?.examId,
  });
  
  // Fetch answers
  const { data: answersData, isLoading: answersLoading } = useQuery({
    queryKey: [`/api/attempts/${id}/answers`],
    enabled: !!id,
  });
  
  const isLoading = attemptLoading || examLoading || answersLoading;
  
  // Error handling
  if (!isLoading && (!attemptData || !examData)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <ThemeToggle />
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>
                نتيجة الاختبار غير متوفرة أو تم إدخال رقم غير صحيح.
              </AlertDescription>
            </Alert>
            <ButtonArabic
              onClick={() => setLocation("/")}
              className="w-full"
            >
              العودة للصفحة الرئيسية
            </ButtonArabic>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <ThemeToggle />
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mb-4">
              <FileText className="h-12 w-12 text-primary mx-auto animate-pulse" />
            </div>
            <CardTitle className="text-xl mb-2">جاري تحميل النتائج...</CardTitle>
            <CardDescription>يرجى الانتظار قليلاً.</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Process data
  const { exam, questions } = examData;
  const answers = answersData || [];
  
  // Calculate stats
  const totalQuestions = questions.length;
  const correctAnswers = answers.filter((answer: any) => answer.isCorrect).length;
  const scorePercentage = Math.round((attemptData.score / attemptData.maxScore) * 100);
  const duration = calculateDuration(attemptData.startTime, attemptData.endTime);
  const { grade, colorClass } = formatGrade(scorePercentage);
  
  // Handle export to PDF
  const handleExportToPDF = async () => {
    try {
      if (resultRef.current) {
        await exportToPDF(resultRef.current, `نتيجة_${exam.title}_${new Date().toLocaleDateString('ar-EG')}`);
        toast({
          title: "تم التصدير",
          description: "تم تصدير النتيجة بتنسيق PDF بنجاح",
        });
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير النتيجة",
        variant: "destructive",
      });
    }
  };
  
  // Handle export to Word
  const handleExportToWord = async () => {
    try {
      if (resultRef.current) {
        await exportToWord(resultRef.current, `نتيجة_${exam.title}_${new Date().toLocaleDateString('ar-EG')}`);
        toast({
          title: "تم التصدير",
          description: "تم تصدير النتيجة بتنسيق Word بنجاح",
        });
      }
    } catch (error) {
      console.error("Error exporting to Word:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير النتيجة",
        variant: "destructive",
      });
    }
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      
      <div className="max-w-4xl mx-auto p-4 pt-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">نتيجة الاختبار</h1>
            <p className="text-muted-foreground">{exam.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonArabic
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </ButtonArabic>
            <ButtonArabic
              variant="outline"
              onClick={handleExportToWord}
            >
              <Download className="ml-2 h-4 w-4" />
              تصدير Word
            </ButtonArabic>
            <ButtonArabic
              onClick={handleExportToPDF}
            >
              <Download className="ml-2 h-4 w-4" />
              تصدير PDF
            </ButtonArabic>
          </div>
        </div>
        
        <div ref={resultRef} className="space-y-6 pb-8">
          {/* Result Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>ملخص النتيجة</CardTitle>
                  <CardDescription>
                    {attemptData.userName || 'الطالب'}
                  </CardDescription>
                </div>
                <Badge 
                  className={`text-lg py-1.5 px-3 ${
                    scorePercentage >= 60 
                      ? 'bg-success/20 text-success border-success' 
                      : 'bg-destructive/20 text-destructive border-destructive'
                  }`}
                >
                  {scorePercentage}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 bg-background rounded-lg">
                  <div className={`text-5xl font-bold mb-2 ${colorClass}`}>
                    {grade}
                  </div>
                  <p className="text-muted-foreground">التقدير</p>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-background rounded-lg">
                  <div className="text-5xl font-bold mb-2">
                    {correctAnswers}/{totalQuestions}
                  </div>
                  <p className="text-muted-foreground">الإجابات الصحيحة</p>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-background rounded-lg">
                  <div className="text-5xl font-bold mb-2">
                    {attemptData.score}/{attemptData.maxScore}
                  </div>
                  <p className="text-muted-foreground">الدرجة</p>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Clock className="ml-2 h-5 w-5 text-muted-foreground" />
                  <span>الوقت المستغرق: {formatDuration(duration)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="ml-2 h-5 w-5 text-muted-foreground" />
                  <span>تاريخ الاختبار: {new Date(attemptData.endTime).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-2">نسبة الأداء</h3>
                <Progress value={scorePercentage} className="h-2 mb-2" />
                <div className="grid grid-cols-3 text-xs">
                  <div>ضعيف (أقل من 60%)</div>
                  <div className="text-center">متوسط (60%-80%)</div>
                  <div className="text-left">ممتاز (أكثر من 80%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الإجابات</CardTitle>
              <CardDescription>
                استعراض إجاباتك والإجابات الصحيحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-4">
                {answers.map((answer: any, index: number) => {
                  const question = questions.find((q: any) => q.id === answer.questionId);
                  if (!question) return null;
                  
                  return (
                    <AccordionItem 
                      key={answer.id} 
                      value={answer.id.toString()}
                      className="border border-border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex flex-1 items-center justify-between">
                          <div className="flex items-center">
                            <Badge variant={getQuestionTypeBadge(question.type)}>
                              {getQuestionTypeLabel(question.type)}
                            </Badge>
                            <span className="mr-2 text-sm font-medium">
                              سؤال {index + 1}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {answer.isCorrect ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success">
                                <CheckCircle className="ml-1 h-3 w-3" />
                                صحيحة
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                                <XCircle className="ml-1 h-3 w-3" />
                                خاطئة
                              </Badge>
                            )}
                            <span className="mr-2 text-sm">
                              ({answer.score}/{question.points})
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-4">
                          <div>
                            <div className="font-medium mb-2">{question.content}</div>
                            
                            {question.type === "multiple-choice" && (
                              <div className="space-y-2">
                                {question.options.map((option: string, optionIndex: number) => (
                                  <div
                                    key={optionIndex}
                                    className={`p-2 rounded-lg ${
                                      answer.answer === option && question.correctAnswer === option
                                        ? "bg-success/10 border border-success text-success"
                                        : answer.answer === option
                                        ? "bg-destructive/10 border border-destructive text-destructive"
                                        : question.correctAnswer === option
                                        ? "bg-muted border border-success text-success"
                                        : "bg-background border border-border"
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <span className="ml-2 font-bold">
                                        {['أ', 'ب', 'ج', 'د'][optionIndex]})
                                      </span>
                                      <span>{option}</span>
                                      {answer.answer === option && question.correctAnswer === option && (
                                        <CheckCircle className="mr-auto h-4 w-4 text-success" />
                                      )}
                                      {answer.answer === option && question.correctAnswer !== option && (
                                        <XCircle className="mr-auto h-4 w-4 text-destructive" />
                                      )}
                                      {answer.answer !== option && question.correctAnswer === option && (
                                        <CheckCircle className="mr-auto h-4 w-4 text-success" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === "true-false" && (
                              <div className="space-y-2">
                                <div
                                  className={`p-2 rounded-lg ${
                                    answer.answer === true && question.correctAnswer === true
                                      ? "bg-success/10 border border-success text-success"
                                      : answer.answer === true
                                      ? "bg-destructive/10 border border-destructive text-destructive"
                                      : question.correctAnswer === true
                                      ? "bg-muted border border-success text-success"
                                      : "bg-background border border-border"
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <span className="ml-2 font-bold">صح</span>
                                    {answer.answer === true && question.correctAnswer === true && (
                                      <CheckCircle className="mr-auto h-4 w-4 text-success" />
                                    )}
                                    {answer.answer === true && question.correctAnswer !== true && (
                                      <XCircle className="mr-auto h-4 w-4 text-destructive" />
                                    )}
                                    {answer.answer !== true && question.correctAnswer === true && (
                                      <CheckCircle className="mr-auto h-4 w-4 text-success" />
                                    )}
                                  </div>
                                </div>
                                
                                <div
                                  className={`p-2 rounded-lg ${
                                    answer.answer === false && question.correctAnswer === false
                                      ? "bg-success/10 border border-success text-success"
                                      : answer.answer === false
                                      ? "bg-destructive/10 border border-destructive text-destructive"
                                      : question.correctAnswer === false
                                      ? "bg-muted border border-success text-success"
                                      : "bg-background border border-border"
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <span className="ml-2 font-bold">خطأ</span>
                                    {answer.answer === false && question.correctAnswer === false && (
                                      <CheckCircle className="mr-auto h-4 w-4 text-success" />
                                    )}
                                    {answer.answer === false && question.correctAnswer !== false && (
                                      <XCircle className="mr-auto h-4 w-4 text-destructive" />
                                    )}
                                    {answer.answer !== false && question.correctAnswer === false && (
                                      <CheckCircle className="mr-auto h-4 w-4 text-success" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {question.type === "essay" && (
                              <div className="space-y-4">
                                <div className="bg-background border border-border rounded-lg p-3">
                                  <h4 className="text-sm font-semibold mb-1">إجابتك:</h4>
                                  <p className="text-sm whitespace-pre-wrap">{answer.answer}</p>
                                </div>
                                
                                {answer.reviewRequested && !answer.reviewed && (
                                  <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>قيد المراجعة</AlertTitle>
                                    <AlertDescription>
                                      تم طلب مراجعة هذه الإجابة وهي قيد المراجعة من قبل المعلم.
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                {answer.reviewed && (
                                  <div className={`bg-${answer.isCorrect ? 'success' : 'destructive'}/10 border border-${answer.isCorrect ? 'success' : 'destructive'} rounded-lg p-3`}>
                                    <h4 className="text-sm font-semibold mb-1">تعليق المراجع:</h4>
                                    <p className="text-sm">{answer.reviewComment || (answer.isCorrect ? 'إجابة صحيحة' : 'إجابة غير صحيحة')}</p>
                                  </div>
                                )}
                                
                                {question.acceptedAnswers && question.acceptedAnswers.length > 0 && (
                                  <div className="bg-success/10 border border-success rounded-lg p-3">
                                    <h4 className="text-sm font-semibold mb-1">الإجابة النموذجية:</h4>
                                    <p className="text-sm">{question.acceptedAnswers[0]}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {!answer.isCorrect && answer.score < question.points && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>تفسير</AlertTitle>
                              <AlertDescription>
                                {question.type === "essay" ? (
                                  <>
                                    {answer.reviewed 
                                      ? answer.reviewComment || "تمت مراجعة الإجابة ولم تكن مطابقة للإجابة النموذجية." 
                                      : "هذه الإجابة تحتاج إلى مراجعة من المعلم."}
                                  </>
                                ) : (
                                  "الإجابة الصحيحة هي: " + 
                                  (typeof question.correctAnswer === "boolean" 
                                    ? question.correctAnswer ? "صح" : "خطأ" 
                                    : question.correctAnswer)
                                )}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
          
          {/* Result Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">توزيع الإجابات</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-background rounded-lg">
                      <div className="text-2xl font-bold">{totalQuestions}</div>
                      <p className="text-muted-foreground text-sm">إجمالي الأسئلة</p>
                    </div>
                    <div className="p-4 bg-success/10 text-success rounded-lg">
                      <div className="text-2xl font-bold">{correctAnswers}</div>
                      <p className="text-success-foreground/80 text-sm">إجابات صحيحة</p>
                    </div>
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                      <div className="text-2xl font-bold">{totalQuestions - correctAnswers}</div>
                      <p className="text-destructive-foreground/80 text-sm">إجابات خاطئة</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">الملاحظات</h3>
                  <p className="text-sm text-muted-foreground">
                    {scorePercentage >= 90 ? (
                      "ممتاز جداً! لقد أظهرت فهماً عميقاً للمادة. استمر في العمل الجيد."
                    ) : scorePercentage >= 80 ? (
                      "جيد جداً! أداؤك قوي، مع وجود مجال بسيط للتحسين."
                    ) : scorePercentage >= 70 ? (
                      "جيد! أظهرت فهماً جيداً، ولكن هناك بعض المفاهيم التي تحتاج إلى مراجعة."
                    ) : scorePercentage >= 60 ? (
                      "مقبول. لديك فهم أساسي، ولكن يوصى بمراجعة المفاهيم التي أخطأت فيها."
                    ) : (
                      "تحتاج إلى مزيد من الدراسة والمراجعة. ركز على المفاهيم الأساسية وحاول مرة أخرى."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <ButtonArabic
                variant="outline"
                onClick={() => setLocation(`/exams/${exam.id}`)}
              >
                استعراض الاختبار
              </ButtonArabic>
              <ButtonArabic
                onClick={() => setLocation("/")}
              >
                العودة للرئيسية
              </ButtonArabic>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Calculate duration in minutes
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'multiple-choice':
      return 'اختيار متعدد';
    case 'true-false':
      return 'صح وخطأ';
    case 'essay':
      return 'سؤال مقالي';
    default:
      return type;
  }
}

function getQuestionTypeBadge(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case 'multiple-choice':
      return 'default';
    case 'true-false':
      return 'secondary';
    case 'essay':
      return 'outline';
    default:
      return 'default';
  }
}
