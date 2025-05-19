import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Download, Printer } from "lucide-react";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { exportToPDF } from "@/lib/export-pdf";
import { exportToWord } from "@/lib/export-word";
import { Exam, Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  questions: Question[];
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  exam,
  questions
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = () => {
    if (previewRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html dir="rtl"><head><title>طباعة الاختبار</title>');
        printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">');
        printWindow.document.write('<style>body{font-family:"Cairo",sans-serif;padding:20px}*{box-sizing:border-box}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(previewRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for everything to load then print
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        toast({
          title: "خطأ",
          description: "فشل في فتح نافذة الطباعة. يرجى التحقق من إعدادات المتصفح.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadPDF = () => {
    if (previewRef.current) {
      exportToPDF(previewRef.current, exam.title).then(() => {
        toast({
          title: "تم التنزيل",
          description: "تم تنزيل ملف PDF بنجاح",
        });
      }).catch((error) => {
        toast({
          title: "خطأ",
          description: "فشل في تنزيل PDF: " + error.message,
          variant: "destructive",
        });
      });
    }
  };

  const handleDownloadWord = () => {
    if (previewRef.current) {
      exportToWord(previewRef.current, exam.title).then(() => {
        toast({
          title: "تم التنزيل",
          description: "تم تنزيل ملف Word بنجاح",
        });
      }).catch((error) => {
        toast({
          title: "خطأ",
          description: "فشل في تنزيل Word: " + error.message,
          variant: "destructive",
        });
      });
    }
  };

  // Format questions by type
  const multipleChoiceQuestions = questions.filter(q => q.type === 'multiple-choice');
  const trueFalseQuestions = questions.filter(q => q.type === 'true-false');
  const essayQuestions = questions.filter(q => q.type === 'essay');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">معاينة الاختبار قبل التصدير</DialogTitle>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>
        
        <div className="p-4 flex justify-end space-x-2 space-x-reverse border-b border-border">
          <ButtonArabic
            onClick={handleDownloadPDF}
          >
            <Download className="ml-1 h-4 w-4" />
            تحميل PDF
          </ButtonArabic>
          <ButtonArabic
            variant="secondary"
            onClick={handleDownloadWord}
          >
            <Download className="ml-1 h-4 w-4" />
            تحميل Word
          </ButtonArabic>
          <ButtonArabic
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="ml-1 h-4 w-4" />
            طباعة
          </ButtonArabic>
        </div>
        
        <div className="overflow-y-auto p-4 max-h-[calc(90vh-9rem)]">
          <div className="flex justify-center">
            <div ref={previewRef} className="paper-page bg-white dark:bg-white w-full max-w-2xl shadow-lg p-8 rounded-lg text-black">
              <div className="text-center mb-8">
                <img 
                  src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120" 
                  alt="شعار المؤسسة التعليمية" 
                  className="h-24 mx-auto mb-4" 
                />
                <h1 className="text-2xl font-bold text-primary-500 mb-2">{exam.title}</h1>
                <p className="text-gray-600">{exam.description}</p>
                <div className="flex justify-center space-x-8 space-x-reverse mt-4 text-gray-600">
                  <div className="flex items-center">
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>المدة: {exam.duration} دقيقة</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>التاريخ: {exam.examDate ? new Date(exam.examDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-300 pt-4 mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="border border-gray-300 rounded p-2">
                    <p className="text-gray-600 text-sm">اسم الطالب: .....................................</p>
                  </div>
                  <div className="border border-gray-300 rounded p-2">
                    <p className="text-gray-600 text-sm">الدرجة: ........ / {questions.reduce((acc, q) => acc + q.points, 0)}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm">تعليمات: يرجى الإجابة على جميع الأسئلة. ساعة الاختبار {exam.duration} دقيقة.</p>
              </div>
              
              <div className="space-y-6 text-gray-800">
                {multipleChoiceQuestions.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold mb-2 bg-primary-50 p-2 border-r-4 border-primary-500">
                      السؤال الأول: اختر الإجابة الصحيحة
                    </h2>
                    <div className="space-y-4 pr-4">
                      {multipleChoiceQuestions.map((question, idx) => (
                        <div key={question.id}>
                          <p className="mb-2">{idx + 1}. {question.content}</p>
                          {Array.isArray(question.options) && (
                            <div className="grid grid-cols-2 gap-2 pr-4">
                              {question.options.map((option, optIdx) => (
                                <div key={optIdx} className="flex items-center">
                                  <span className="w-5 h-5 border border-gray-400 rounded-full ml-2"></span>
                                  <span>{['أ', 'ب', 'ج', 'د'][optIdx]}) {option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {trueFalseQuestions.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold mb-2 bg-primary-50 p-2 border-r-4 border-primary-500">
                      {multipleChoiceQuestions.length > 0 ? 'السؤال الثاني' : 'السؤال الأول'}: صح أم خطأ
                    </h2>
                    <div className="space-y-4 pr-4">
                      {trueFalseQuestions.map((question, idx) => (
                        <div key={question.id}>
                          <p className="mb-1">{idx + 1}. {question.content}</p>
                          <div className="flex space-x-4 space-x-reverse pr-4">
                            <div className="flex items-center">
                              <span className="w-5 h-5 border border-gray-400 rounded-sm ml-2"></span>
                              <span>صح</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-5 h-5 border border-gray-400 rounded-sm ml-2"></span>
                              <span>خطأ</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {essayQuestions.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold mb-2 bg-primary-50 p-2 border-r-4 border-primary-500">
                      {multipleChoiceQuestions.length > 0 || trueFalseQuestions.length > 0 ? 
                        (multipleChoiceQuestions.length > 0 && trueFalseQuestions.length > 0 ? 'السؤال الثالث' : 'السؤال الثاني') : 
                        'السؤال الأول'}: أجب عن الأسئلة التالية
                    </h2>
                    <div className="space-y-4 pr-4">
                      {essayQuestions.map((question, idx) => (
                        <div key={question.id}>
                          <p className="mb-1">{idx + 1}. {question.content}</p>
                          <div className="border border-gray-300 rounded p-2 h-24 w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-300 mt-8 pt-4 text-center text-gray-600">
                <p>مع تمنياتنا بالتوفيق والنجاح</p>
                <p className="text-sm">© {new Date().getFullYear()} منصة الاختبارات الإلكترونية</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
