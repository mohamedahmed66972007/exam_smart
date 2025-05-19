import React, { useState } from "react";
import { Question } from "@shared/schema";
import { Plus, Trash2 } from "lucide-react";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { cn } from "@/lib/utils";

interface QuestionTypeProps {
  question: Question;
  onChange: (data: Partial<Question>) => void;
}

export const MultipleChoiceQuestion: React.FC<QuestionTypeProps> = ({
  question,
  onChange
}) => {
  const options = Array.isArray(question.options) ? question.options : [];
  const correctAnswer = question.correctAnswer as string;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ content: e.target.value });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange({ options: newOptions });
  };

  const handleCorrectAnswerChange = (value: string) => {
    onChange({ correctAnswer: value });
  };

  const addOption = () => {
    if (options.length < 6) {
      onChange({ options: [...options, ""] });
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      // If the removed option was the correct answer, reset the correct answer
      if (correctAnswer === options[index]) {
        onChange({
          options: newOptions,
          correctAnswer: ""
        });
      } else {
        onChange({ options: newOptions });
      }
    }
  };

  return (
    <div>
      <div className="mb-3">
        <textarea
          className="form-input"
          placeholder="أدخل نص السؤال..."
          value={question.content}
          onChange={handleContentChange}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 flex items-center justify-center rounded-full ml-2 cursor-pointer",
                correctAnswer === option
                  ? "bg-primary text-white"
                  : "bg-background border border-border"
              )}
              onClick={() => handleCorrectAnswerChange(option)}
            >
              {["أ", "ب", "ج", "د", "هـ", "و"][index]}
            </div>
            <input
              type="text"
              className="form-input flex-1"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`الخيار ${index + 1}`}
            />
            {options.length > 2 && (
              <button
                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                onClick={() => removeOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < 6 && (
        <ButtonArabic
          variant="outline"
          className="mt-2 text-xs"
          onClick={addOption}
        >
          <Plus className="h-3 w-3 mr-1" />
          إضافة خيار
        </ButtonArabic>
      )}
    </div>
  );
};

export const TrueFalseQuestion: React.FC<QuestionTypeProps> = ({
  question,
  onChange
}) => {
  const correctAnswer = question.correctAnswer === true || question.correctAnswer === "true";

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ content: e.target.value });
  };

  const handleCorrectAnswerChange = (value: boolean) => {
    onChange({ correctAnswer: value });
  };

  return (
    <div>
      <div className="mb-3">
        <textarea
          className="form-input"
          placeholder="أدخل نص السؤال..."
          value={question.content}
          onChange={handleContentChange}
          rows={2}
        />
      </div>

      <div className="flex space-x-4 space-x-reverse text-sm">
        <div className="flex items-center">
          <input
            type="radio"
            id={`true-${question.id}`}
            name={`q-${question.id}`}
            className="ml-2"
            checked={correctAnswer}
            onChange={() => handleCorrectAnswerChange(true)}
          />
          <label htmlFor={`true-${question.id}`}>صح</label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id={`false-${question.id}`}
            name={`q-${question.id}`}
            className="ml-2"
            checked={!correctAnswer}
            onChange={() => handleCorrectAnswerChange(false)}
          />
          <label htmlFor={`false-${question.id}`}>خطأ</label>
        </div>
      </div>
    </div>
  );
};

export const EssayQuestion: React.FC<QuestionTypeProps> = ({
  question,
  onChange
}) => {
  const acceptedAnswers = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [""];

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ content: e.target.value });
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...acceptedAnswers];
    newAnswers[index] = value;
    onChange({ acceptedAnswers: newAnswers });
  };

  const addAcceptedAnswer = () => {
    onChange({ acceptedAnswers: [...acceptedAnswers, ""] });
  };

  const removeAcceptedAnswer = (index: number) => {
    if (acceptedAnswers.length > 1) {
      const newAnswers = acceptedAnswers.filter((_, i) => i !== index);
      onChange({ acceptedAnswers: newAnswers });
    }
  };

  return (
    <div>
      <div className="mb-3">
        <textarea
          className="form-input"
          placeholder="أدخل نص السؤال..."
          value={question.content}
          onChange={handleContentChange}
          rows={2}
        />
      </div>

      <div className="bg-background p-3 rounded-lg text-sm border border-border">
        <p className="text-muted-foreground mb-2">الإجابات النموذجية المقبولة:</p>
        <div className="space-y-2">
          {acceptedAnswers.map((answer, index) => (
            <div key={index} className="flex items-start">
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full ml-2 mt-0.5 min-w-[18px] text-center",
                  index === 0
                    ? "bg-primary text-white"
                    : "bg-background border border-border"
                )}
              >
                {index + 1}
              </span>
              <textarea
                className="form-input flex-1"
                placeholder={`إجابة نموذجية ${index + 1}`}
                value={answer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                rows={2}
              />
              {acceptedAnswers.length > 1 && (
                <button
                  className="text-destructive hover:bg-destructive/10 p-1 rounded mr-1"
                  onClick={() => removeAcceptedAnswer(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <ButtonArabic
          className="mt-2 text-xs"
          variant="link"
          onClick={addAcceptedAnswer}
        >
          <Plus className="ml-1 h-3 w-3" />
          إضافة إجابة نموذجية أخرى
        </ButtonArabic>
      </div>
    </div>
  );
};
