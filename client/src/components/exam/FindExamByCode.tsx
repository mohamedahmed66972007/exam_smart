import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { useToast } from "@/hooks/use-toast";

export function FindExamByCode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [examCode, setExamCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Check for exam by code when isSearching is true
  const { 
    data: examData, 
    isLoading, 
    error, 
    isError 
  } = useQuery({
    queryKey: [`/api/public/exams/code/${examCode}`],
    enabled: isSearching && examCode.length > 0
  });
  
  // Handle success and error cases
  useEffect(() => {
    if (isSearching) {
      if (examData) {
        setIsSearching(false);
        setLocation(`/exam/${examCode}`);
      } else if (isError) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على هذا الاختبار",
          variant: "destructive",
        });
        setIsSearching(false);
      }
    }
  }, [examData, isError, isSearching, examCode, setLocation, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCode.trim()) {
      toast({
        title: "إدخال غير صحيح",
        description: "يرجى إدخال رمز الاختبار",
      });
      return;
    }

    setIsSearching(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">البحث عن اختبار</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="أدخل رمز الاختبار..."
              className="pl-3 pr-10"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <ButtonArabic 
          onClick={handleSearch} 
          disabled={isLoading || !examCode.trim()}
          className="w-full"
        >
          الانتقال للاختبار
          {isLoading && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>}
        </ButtonArabic>
      </CardFooter>
    </Card>
  );
}