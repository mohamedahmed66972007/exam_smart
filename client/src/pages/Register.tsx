import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ThemeToggle from "@/components/layout/ThemeToggle";

const formSchema = z.object({
  username: z.string().min(3, {
    message: "اسم المستخدم يجب أن يكون على الأقل 3 أحرف",
  }),
  password: z.string().min(6, {
    message: "كلمة المرور يجب أن تكون على الأقل 6 أحرف",
  }),
  name: z.string().min(3, {
    message: "الاسم يجب أن يكون على الأقل 3 أحرف",
  }),
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صحيح",
  }),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // تعيين الدور بشكل افتراضي للمستخدمين الجدد
      const userWithRole = {
        ...values,
        role: "user" // استخدام دور موحد لجميع المستخدمين
      };
      
      const response = await apiRequest("POST", "/api/auth/register", userWithRole);
      
      if (response.ok) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "مرحبًا بك في منصة الاختبارات الإلكترونية",
        });
        setLocation("/");
      } else {
        const data = await response.json();
        toast({
          title: "فشل إنشاء الحساب",
          description: data.message || "حدث خطأ أثناء إنشاء الحساب",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-8">
      <ThemeToggle />
      
      <div className="w-full max-w-md px-4">
        <Card className="border-border">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              أنشئ حسابك للوصول إلى نظام الاختبارات الإلكترونية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسمك الكامل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="أدخل بريدك الإلكتروني" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المستخدم" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="أدخل كلمة المرور" 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                
                <ButtonArabic 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "جاري إنشاء الحساب..." : (
                    <>
                      <UserPlus className="ml-2 h-4 w-4" />
                      إنشاء حساب
                    </>
                  )}
                </ButtonArabic>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              لديك حساب بالفعل؟{" "}
              <a
                onClick={() => setLocation("/login")}
                className="text-primary underline cursor-pointer"
              >
                تسجيل الدخول
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} منصة الاختبارات الإلكترونية. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
