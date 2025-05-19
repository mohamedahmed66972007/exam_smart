import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Home, 
  FileText, 
  BarChart2, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { User } from "@shared/schema";

export default function Sidebar() {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false); // Always collapsed by default
  const [location] = useLocation();
  
  const { data: user } = useQuery<User>({ 
    queryKey: ['/api/auth/current-user'],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile nav toggle */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="md:hidden fixed top-4 right-4 z-30 bg-card p-2 rounded-lg shadow-lg"
        >
          <Menu className="text-primary" />
        </button>
      )}

      <nav className={`fixed right-0 top-0 h-full w-64 bg-card shadow-lg overflow-y-auto transition-all duration-200 transform z-40 ${
        isOpen ? "" : "translate-x-full md:translate-x-0"
      }`}>
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <a className="font-bold text-xl text-primary">نظام الاختبارات</a>
            </Link>
            {isMobile && (
              <button onClick={closeSidebar} className="md:hidden text-muted-foreground hover:text-foreground">
                <X />
              </button>
            )}
          </div>
          
          <div className="flex flex-col space-y-2 mb-8">
            <div className="flex flex-col items-center p-4 bg-background rounded-lg">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="صورة المستخدم" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-primary">
                  <span className="text-xl font-bold">{user?.name?.charAt(0) || "م"}</span>
                </div>
              )}
              <h2 className="mt-2 font-semibold text-primary">{user?.name || "المستخدم"}</h2>
            </div>
          </div>
          
          <div className="space-y-1">
            <Link href="/">
              <a 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  location === "/" ? "text-primary bg-primary/10" : "text-foreground hover:bg-background"
                }`}
              >
                <Home className="ml-3" />
                <span>الرئيسية</span>
              </a>
            </Link>
            
            <Link href="/exams">
              <a 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  location === "/exams" || location.startsWith("/exams/") ? "text-primary bg-primary/10" : "text-foreground hover:bg-background"
                }`}
              >
                <FileText className="ml-3" />
                <span>الاختبارات</span>
              </a>
            </Link>
            
            <Link href="/results">
              <a 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  location === "/results" || location.startsWith("/exam-result/") ? "text-primary bg-primary/10" : "text-foreground hover:bg-background"
                }`}
              >
                <BarChart2 className="ml-3" />
                <span>النتائج</span>
              </a>
            </Link>
            
            <Link href="/settings">
              <a 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  location === "/settings" ? "text-primary bg-primary/10" : "text-foreground hover:bg-background"
                }`}
              >
                <Settings className="ml-3" />
                <span>الإعدادات</span>
              </a>
            </Link>
          </div>
          
          <div className="mt-8 pt-4 border-t border-border">
            <button 
              onClick={handleLogout} 
              className="flex items-center px-4 py-3 text-destructive hover:bg-background rounded-lg w-full"
            >
              <LogOut className="ml-3 flip-icon" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
