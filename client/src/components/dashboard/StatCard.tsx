import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconClass?: string;
  iconBgClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconClass = "text-primary",
  iconBgClass = "bg-primary-50 dark:bg-primary-900/20"
}) => {
  return (
    <div className="bg-card rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={cn("rounded-full p-3 ml-4", iconBgClass)}>
          <div className={cn("text-xl", iconClass)}>{icon}</div>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
