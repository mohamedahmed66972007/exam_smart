import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useTheme } from "@/components/layout/ThemeProvider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Moon,
  Sun,
  Laptop,
  User as UserIcon,
  Lock,
  LogOut,
  Save
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(3, {
    message: "الاسم يجب أن يكون على الأقل 3 أحرف",
  }),
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صحيح",
  }),
  avatar: z.string().optional(),
});

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "كلمة المرور الحالية يجب أن تكون على الأقل 6 أحرف",
  }),
  newPassword: z.string().min(6, {
    message: "كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف",
  }),
  confirmPassword: z.string().min(6, {
    message: "تأكيد كلمة المرور يجب أن تكون على الأقل 6 أحرف",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
  path: ["confirmPassword"],
});

// App settings schema
const appSettingsSchema = z.object({
  defaultExamDuration: z.number().min(10, {
    message: "مدة الاختبار يجب أن تكون على الأقل 10 دقائق",
  }).max(240, {
    message: "مدة الاختبار يجب أن تكون أقل من 240 دقيقة",
  }),
  language: z.enum(["ar", "en"]),
});

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useTheme();
  
  // Fetch current user
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/current-user'],
  });
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
  });
  
  // Update values when user data loads
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      });
    }
  }, [user, profileForm]);
  
  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // App settings form
  const appSettingsForm = useForm<z.infer<typeof appSettingsSchema>>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      defaultExamDuration: 60,
      language: "ar",
    },
  });
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest("PUT", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم تحديث بيانات ملفك الشخصي بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
    }
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const response = await apiRequest("PUT", "/api/users/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      console.error("Error updating password:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    }
  });
  
  // App settings update function
  const updateAppSettings = (data: z.infer<typeof appSettingsSchema>) => {
    // This would typically be stored in local storage or user preferences
    localStorage.setItem("examSettings", JSON.stringify(data));
    
    // Update language if changed
    if (data.language !== localStorage.getItem("language")) {
      localStorage.setItem("language", data.language);
      // Would normally trigger a language change via i18n library here
    }
    
    toast({
      title: "تم تحديث الإعدادات",
      description: "تم تحديث إعدادات التطبيق بنجاح",
    });
  };
  
  // Logout function
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
      
      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <Sidebar />
      
      <main className="md:pr-64 p-4 transition-all duration-200">
        {/* Page Header */}
        <header className="mb-6 mt-16 md:mt-6">
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-muted-foreground">تخصيص إعدادات الحساب والتطبيق</p>
          </div>
        </header>
        
        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="password">كلمة المرور</TabsTrigger>
            <TabsTrigger value="appearance">المظهر</TabsTrigger>
            <TabsTrigger value="app">إعدادات التطبيق</TabsTrigger>
          </TabsList>
          
          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>الملف الشخصي</CardTitle>
                <CardDescription>
                  تحديث معلومات ملفك الشخصي
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                  </div>
                ) : (
                  <Form {...profileForm}>
                    <form 
                      onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                      className="space-y-6"
                    >
                      <div className="flex flex-col items-center mb-6">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage 
                            src={user?.avatar || ""} 
                            alt={user?.name || "المستخدم"} 
                          />
                          <AvatarFallback className="text-2xl">
                            {user?.name?.charAt(0) || "م"}
                          </AvatarFallback>
                        </Avatar>
                        <FormField
                          control={profileForm.control}
                          name="avatar"
                          render={({ field }) => (
                            <FormItem className="w-full max-w-sm">
                              <FormLabel>رابط الصورة الشخصية</FormLabel>
                              <FormControl>
                                <Input placeholder="أدخل رابط الصورة" {...field} />
                              </FormControl>
                              <FormDescription>
                                رابط URL للصورة الشخصية الخاصة بك
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
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
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل بريدك الإلكتروني" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <ButtonArabic 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          "جاري الحفظ..."
                        ) : (
                          <>
                            <Save className="ml-2 h-4 w-4" />
                            حفظ التغييرات
                          </>
                        )}
                      </ButtonArabic>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Password Settings */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>تغيير كلمة المرور</CardTitle>
                <CardDescription>
                  قم بتحديث كلمة المرور الخاصة بك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form 
                    onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))}
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الحالية</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="أدخل كلمة المرور الحالية" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="أدخل كلمة المرور الجديدة" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            يجب أن تكون كلمة المرور 6 أحرف على الأقل
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="أكد كلمة المرور الجديدة" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <ButtonArabic 
                      type="submit" 
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? (
                        "جاري التحديث..."
                      ) : (
                        <>
                          <Lock className="ml-2 h-4 w-4" />
                          تحديث كلمة المرور
                        </>
                      )}
                    </ButtonArabic>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>المظهر</CardTitle>
                <CardDescription>
                  تخصيص مظهر التطبيق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">سمة التطبيق</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div 
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 ${
                          theme === "light" ? "border-primary" : "border-border"
                        } cursor-pointer`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="h-16 w-16 rounded-full bg-light-bg flex items-center justify-center mb-2">
                          <Sun className="h-8 w-8 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium">فاتح</span>
                      </div>
                      
                      <div 
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 ${
                          theme === "dark" ? "border-primary" : "border-border"
                        } cursor-pointer`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="h-16 w-16 rounded-full bg-dark-bg flex items-center justify-center mb-2">
                          <Moon className="h-8 w-8 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">داكن</span>
                      </div>
                      
                      <div 
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 ${
                          theme === "system" ? "border-primary" : "border-border"
                        } cursor-pointer`}
                        onClick={() => setTheme("system")}
                      >
                        <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                          <Laptop className="h-8 w-8 text-primary" />
                        </div>
                        <span className="text-sm font-medium">النظام</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      اختر سمة فاتحة، داكنة، أو استخدم إعدادات نظامك.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* App Settings */}
          <TabsContent value="app">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات التطبيق</CardTitle>
                <CardDescription>
                  تخصيص إعدادات التطبيق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appSettingsForm}>
                  <form 
                    onSubmit={appSettingsForm.handleSubmit(updateAppSettings)}
                    className="space-y-6"
                  >
                    <FormField
                      control={appSettingsForm.control}
                      name="defaultExamDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدة الافتراضية للاختبار (دقائق)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            المدة الافتراضية عند إنشاء اختبار جديد
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appSettingsForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اللغة</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر لغة التطبيق" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ar">العربية</SelectItem>
                              <SelectItem value="en">الإنجليزية</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            لغة واجهة المستخدم
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <ButtonArabic type="submit">
                      <Save className="ml-2 h-4 w-4" />
                      حفظ الإعدادات
                    </ButtonArabic>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Logout Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-destructive">تسجيل الخروج</CardTitle>
                <CardDescription>
                  تسجيل الخروج من حسابك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  عند تسجيل الخروج، سيتم إنهاء جلستك الحالية وستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى حسابك.
                </p>
                <ButtonArabic 
                  variant="destructive" 
                  onClick={handleLogout}
                >
                  <LogOut className="ml-2 h-4 w-4 flip-icon" />
                  تسجيل الخروج
                </ButtonArabic>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
