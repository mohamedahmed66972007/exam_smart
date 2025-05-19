import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Plus, FileUp } from "lucide-react";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { format } from "date-fns";
import { QuestionItem } from "./QuestionItem";
import { MultipleChoiceQuestion, TrueFalseQuestion, EssayQuestion } from "./QuestionTypes";

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateExam: (examData: any) => void;
  onSaveDraft: (examData: any) => void;
}

interface Question {
  id: number;
  type: "multiple-choice" | "true-false" | "essay";
  content: string;
  options?: string[];
  correctAnswer?: string | boolean;
  acceptedAnswers?: string[];
  points: number;
  order: number;
}

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  isOpen,
  onClose,
  onCreateExam,
  onSaveDraft
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [allowReview, setAllowReview] = useState(true);

  const addQuestion = (type: "multiple-choice" | "true-false" | "essay") => {
    const newQuestion: Question = {
      id: Date.now(),
      type,
      content: "",
      points: type === "essay" ? 5 : type === "multiple-choice" ? 2 : 1,
      order: questions.length + 1
    };

    if (type === "multiple-choice") {
      newQuestion.options = ["", "", "", ""];
      newQuestion.correctAnswer = "";
    } else if (type === "true-false") {
      newQuestion.correctAnswer = true;
    } else if (type === "essay") {
      newQuestion.acceptedAnswers = [""];
    }

    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: number, data: Partial<Question>) => {
    setQuestions(
      questions.map(q => (q.id === id ? { ...q, ...data } : q))
    );
  };

  const deleteQuestion = (id: number) => {
    setQuestions(
      questions.filter(q => q.id !== id)
        .map((q, i) => ({ ...q, order: i + 1 }))
    );
  };

  const handleSubmit = (isDraft: boolean = false) => {
    const examData = {
      title,
      description,
      subject,
      grade,
      duration,
      status: isDraft ? "draft" : "active",
      shuffleQuestions,
      showResults,
      showCorrectAnswers,
      allowReview,
      questions
    };

    if (isDraft) {
      onSaveDraft(examData);
    } else {
      onCreateExam(examData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">إنشاء اختبار جديد</DialogTitle>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto p-4 max-h-[calc(90vh-8rem)]">
          <div className="mb-6">
            <label className="block mb-2 font-semibold">عنوان الاختبار</label>
            <input
              type="text"
              className="form-input"
              placeholder="أدخل عنوان الاختبار..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-semibold">الصف الدراسي</label>
              <select
                className="form-select"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="">اختر الصف الدراسي</option>
                <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold">المادة</label>
              <select
                className="form-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">اختر المادة</option>
                <option value="اللغة العربية">اللغة العربية</option>
                <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                <option value="الرياضيات">الرياضيات</option>
                <option value="الكيمياء">الكيمياء</option>
                <option value="الفيزياء">الفيزياء</option>
                <option value="الأحياء">الأحياء</option>
                <option value="الجيولوجيا">الجيولوجيا</option>
                <option value="الدستور">الدستور</option>
                <option value="الاجتماعيات">الاجتماعيات</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-semibold">مدة الاختبار (بالدقائق)</label>
            <input
              type="number"
              className="form-input"
              placeholder="60"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-semibold">وصف الاختبار</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="أدخل وصفاً للاختبار..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">الأسئلة</h3>
              <div className="flex space-x-2 space-x-reverse">
                <ButtonArabic
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("multiple-choice")}
                >
                  <Plus className="ml-1 h-4 w-4" />
                  اختيار متعدد
                </ButtonArabic>
                <ButtonArabic
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("true-false")}
                >
                  <Plus className="ml-1 h-4 w-4" />
                  صح وخطأ
                </ButtonArabic>
                <ButtonArabic
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("essay")}
                >
                  <Plus className="ml-1 h-4 w-4" />
                  سؤال مقالي
                </ButtonArabic>
              </div>
            </div>
            
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                />
              ))}
              
              {questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد أسئلة بعد. قم بإضافة سؤال باستخدام الأزرار أعلاه.
                </div>
              )}
            </div>
            
            <ButtonArabic
              className="mt-4 w-full"
              variant="outline"
              onClick={() => addQuestion("multiple-choice")}
            >
              <Plus className="ml-1" />
              إضافة سؤال جديد
            </ButtonArabic>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-semibold">ارفاق ملف (اختياري)</label>
            <div className="border border-dashed border-border rounded-lg p-6 text-center bg-background">
              <FileUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-2">قم بسحب الملفات هنا أو انقر للتصفح</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, PNG, JPG (حد أقصى 10MB)</p>
            </div>
          </div>
          
          <div className="border-t border-border pt-4 mb-4">
            <h3 className="font-bold text-lg mb-3">إعدادات الاختبار</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="shuffle-questions"
                  className="form-checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                />
                <label htmlFor="shuffle-questions">ترتيب عشوائي للأسئلة</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-result"
                  className="form-checkbox"
                  checked={showResults}
                  onChange={(e) => setShowResults(e.target.checked)}
                />
                <label htmlFor="show-result">عرض النتيجة للطالب بعد الانتهاء</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-correct-answers"
                  className="form-checkbox"
                  checked={showCorrectAnswers}
                  onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                />
                <label htmlFor="show-correct-answers">عرض الإجابات الصحيحة بعد الانتهاء</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow-review"
                  className="form-checkbox"
                  checked={allowReview}
                  onChange={(e) => setAllowReview(e.target.checked)}
                />
                <label htmlFor="allow-review">السماح بطلب مراجعة الأسئلة المقالية</label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t border-border p-4 flex justify-between">
          <ButtonArabic
            variant="outline"
            onClick={() => handleSubmit(true)}
          >
            حفظ كمسودة
          </ButtonArabic>
          <div className="flex space-x-2 space-x-reverse">
            <ButtonArabic
              variant="outline"
              onClick={onClose}
            >
              إلغاء
            </ButtonArabic>
            <ButtonArabic
              onClick={() => handleSubmit(false)}
            >
              إنشاء الاختبار
            </ButtonArabic>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamModal;
