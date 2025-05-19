import React from "react";
import { Trash2, Edit } from "lucide-react";
import { Question } from "@shared/schema";
import { MultipleChoiceQuestion, TrueFalseQuestion, EssayQuestion } from "./QuestionTypes";

interface QuestionItemProps {
  question: Question;
  questionNumber: number;
  onUpdate: (id: number, data: Partial<Question>) => void;
  onDelete: (id: number) => void;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  questionNumber,
  onUpdate,
  onDelete
}) => {
  const getQuestionType = (type: string): string => {
    switch (type) {
      case "multiple-choice":
        return "اختيار متعدد";
      case "true-false":
        return "صح وخطأ";
      case "essay":
        return "مقالي";
      default:
        return type;
    }
  };

  const renderQuestionEditor = () => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceQuestion
            question={question}
            onChange={(data) => onUpdate(question.id, data)}
          />
        );
      case "true-false":
        return (
          <TrueFalseQuestion
            question={question}
            onChange={(data) => onUpdate(question.id, data)}
          />
        );
      case "essay":
        return (
          <EssayQuestion
            question={question}
            onChange={(data) => onUpdate(question.id, data)}
          />
        );
      default:
        return <div>نوع سؤال غير معروف</div>;
    }
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold">
          سؤال {questionNumber} ({getQuestionType(question.type)})
        </h4>
        <div className="flex space-x-2 space-x-reverse">
          <button
            className="text-secondary hover:bg-secondary/10 p-1 rounded"
            onClick={() => {
              // This is handled by the specific question type components
              // Just a placeholder button for the UI
            }}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="text-destructive hover:bg-destructive/10 p-1 rounded"
            onClick={() => onDelete(question.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {renderQuestionEditor()}
    </div>
  );
};

export default QuestionItem;
