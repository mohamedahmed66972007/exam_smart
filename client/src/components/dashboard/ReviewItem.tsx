import React from "react";

interface ReviewItemProps {
  student: {
    id: number;
    name: string;
    avatar?: string;
  };
  exam: {
    id: number;
    title: string;
  };
  question: {
    id: number;
    number: number;
    content: string;
  };
  answer: string;
  onAccept: (questionId: number, answerId: number) => void;
  onReject: (questionId: number, answerId: number) => void;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
  student,
  exam,
  question,
  answer,
  onAccept,
  onReject
}) => {
  return (
    <div className="border border-border rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={`صورة ${student.name}`}
                className="w-8 h-8 rounded-full ml-2 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2">
                <span className="text-primary text-sm font-bold">
                  {student.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold">{student.name}</h3>
              <p className="text-muted-foreground text-sm">
                {exam.title} - السؤال {question.number}
              </p>
            </div>
          </div>
          <div className="mt-3 bg-background p-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">السؤال: {question.content}</p>
            <p className="text-muted-foreground">إجابة الطالب: {answer}</p>
          </div>
        </div>
        <span className="bg-secondary-50 dark:bg-secondary-900/20 text-secondary text-xs px-2 py-1 rounded whitespace-nowrap">
          قيد المراجعة
        </span>
      </div>
      <div className="flex justify-end mt-3 space-x-2 space-x-reverse">
        <button
          onClick={() => onAccept(question.id, student.id)}
          className="px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded text-sm"
        >
          قبول الإجابة
        </button>
        <button
          onClick={() => onReject(question.id, student.id)}
          className="px-3 py-1 bg-destructive hover:bg-destructive/90 text-white rounded text-sm"
        >
          رفض الإجابة
        </button>
      </div>
    </div>
  );
};

export default ReviewItem;
