import React from "react";
import { Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatDuration } from "@/lib/exam-utils";

interface ResultData {
  id: number;
  student: {
    id: number;
    name: string;
    avatar?: string;
  };
  exam: {
    id: number;
    title: string;
  };
  score: number;
  maxScore: number;
  duration: number; // in minutes
  date: Date;
}

interface ResultsTableProps {
  results: ResultData[];
  onView: (id: number) => void;
  onDownload: (id: number) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  onView,
  onDownload
}) => {
  const getScoreClass = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) {
      return "bg-success-50 dark:bg-success-900/20 text-success";
    } else if (percentage >= 60) {
      return "bg-secondary-50 dark:bg-secondary-900/20 text-secondary";
    } else {
      return "bg-error-50 dark:bg-error-900/20 text-error";
    }
  };

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background text-right">
              <th className="py-3 px-4 font-semibold">الطالب</th>
              <th className="py-3 px-4 font-semibold">الاختبار</th>
              <th className="py-3 px-4 font-semibold">الدرجة</th>
              <th className="py-3 px-4 font-semibold">الوقت المستغرق</th>
              <th className="py-3 px-4 font-semibold">التاريخ</th>
              <th className="py-3 px-4 font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id} className="border-t border-border hover:bg-background">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {result.student.avatar ? (
                      <img
                        src={result.student.avatar}
                        alt={`صورة ${result.student.name}`}
                        className="w-8 h-8 rounded-full ml-2 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2">
                        <span className="text-primary text-sm font-bold">
                          {result.student.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span>{result.student.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{result.exam.title}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${getScoreClass(
                      result.score,
                      result.maxScore
                    )}`}
                  >
                    {Math.round((result.score / result.maxScore) * 100)}%
                  </span>
                </td>
                <td className="py-3 px-4">{formatDuration(result.duration)}</td>
                <td className="py-3 px-4">
                  {format(result.date, "dd/MM/yyyy", { locale: ar })}
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => onView(result.id)}
                      className="text-primary hover:bg-primary/10 p-1 rounded"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDownload(result.id)}
                      className="text-secondary hover:bg-secondary/10 p-1 rounded"
                      title="تحميل النتيجة"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
