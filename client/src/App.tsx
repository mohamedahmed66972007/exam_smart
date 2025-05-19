import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Exams from "@/pages/Exams";
import Results from "@/pages/Results";
import Settings from "@/pages/Settings";
import TakeExam from "@/pages/TakeExam";
import ExamResult from "@/pages/ExamResult";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "wouter";

// Define authentication guard for routes
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/current-user'],
    retry: false,
  });
  
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);
  
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">جاري التحميل...</div>;
  }
  
  return user ? <Component {...rest} /> : null;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/exams" component={() => <ProtectedRoute component={Exams} />} />
      <Route path="/results" component={() => <ProtectedRoute component={Results} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/exam/:code" component={TakeExam} />
      <Route path="/exam-result/:id" component={ExamResult} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">جاري التحميل...</div>}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
