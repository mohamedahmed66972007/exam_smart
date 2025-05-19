import React from "react";
import { 
  Share, 
  Edit, 
  BarChart2, 
  Trash2, 
  Download, 
  Clock, 
  Calendar, 
  HelpCircle, 
  Users 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Exam } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ExamCardProps {
  exam: Exam;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onShare: (id: number) => void;
  onStats: (id: number) => void;
  onExport?: (id: number) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onDelete,
  onEdit,
  onShare,
  onStats,
  onExport
}) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary-50 dark:bg-primary-900/20 text-primary";
      case "draft":
        return "bg-secondary-50 dark:bg-secondary-900/20 text-secondary";
      case "completed":
        return "bg-error-50 dark:bg-error-900/20 text-error";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "نشط";
      case "draft":
        return "مسودة";
      case "completed":
        return "منتهي";
      default:
        return status;
    }
  };

  const formattedDate = exam.examDate 
    ? formatDistanceToNow(new Date(exam.examDate), { addSuffix: true, locale: ar }) 
    : "قيد الإعداد";

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg">{exam.title}</h3>
          <span className={cn("text-xs px-2 py-1 rounded", getStatusClasses(exam.status))}>
            {getStatusText(exam.status)}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-3">{exam.description}</p>
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="ml-4">
            <HelpCircle className="inline mr-1 h-4 w-4" /> {exam.examId} سؤال
          </span>
          <span>
            <Clock className="inline mr-1 h-4 w-4" /> {exam.duration} دقيقة
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="ml-4">
            <Calendar className="inline mr-1 h-4 w-4" /> {formattedDate}
          </span>
          {exam.status === "active" && (
            <span className="bg-success-50 dark:bg-success-900/20 text-success px-2 py-0.5 rounded-full text-xs">
              <Users className="inline mr-1 h-3 w-3" /> 28/30
            </span>
          )}
          {exam.status === "draft" && (
            <span className="bg-secondary-50 dark:bg-secondary-900/20 text-secondary px-2 py-0.5 rounded-full text-xs">
              <Edit className="inline mr-1 h-3 w-3" /> مسودة
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-border p-3 bg-background flex justify-between">
        <div className="flex space-x-2 space-x-reverse">
          {exam.status === "draft" ? (
            <button 
              onClick={() => onShare(exam.id)} 
              className="text-gray-400 cursor-not-allowed p-2 rounded"
              disabled
            >
              <Share className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={() => onShare(exam.id)} 
              className="text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 p-2 rounded"
            >
              <Share className="h-4 w-4" />
            </button>
          )}
          
          {exam.status === "completed" ? (
            <button 
              onClick={() => onEdit(exam.id)} 
              className="text-gray-400 cursor-not-allowed p-2 rounded"
              disabled
            >
              <Edit className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={() => onEdit(exam.id)} 
              className="text-secondary hover:bg-secondary-50 dark:hover:bg-secondary-900/20 p-2 rounded"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          
          {exam.status === "draft" ? (
            <button 
              onClick={() => onStats(exam.id)} 
              className="text-gray-400 cursor-not-allowed p-2 rounded"
              disabled
            >
              <BarChart2 className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={() => onStats(exam.id)} 
              className="text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 p-2 rounded"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
          )}
          
          {exam.status === "completed" && onExport && (
            <button 
              onClick={() => onExport(exam.id)} 
              className="text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 p-2 rounded"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
        <button 
          onClick={() => onDelete(exam.id)} 
          className="text-destructive hover:bg-destructive-50 dark:hover:bg-destructive/20 p-2 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ExamCard;
