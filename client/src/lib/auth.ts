import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

/**
 * Custom hook for authentication utilities in Arabic Exam Platform
 */
export const authUtils = {
  // Check if user is authenticated by looking at the current user query 
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const user = queryClient.getQueryData<User>(['/api/auth/current-user']);
      
      if (user) {
        return true;
      }
      
      // If not in cache, try to fetch
      const res = await fetch('/api/auth/current-user', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const userData = await res.json();
        queryClient.setQueryData(['/api/auth/current-user'], userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Authentication check failed:", error);
      return false;
    }
  },

  // Get the current authenticated user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const user = queryClient.getQueryData<User>(['/api/auth/current-user']);
      
      if (user) {
        return user;
      }
      
      // If not in cache, try to fetch
      const res = await fetch('/api/auth/current-user', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const userData = await res.json();
        queryClient.setQueryData(['/api/auth/current-user'], userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  },

  // Login a user with username and password
  login: async (username: string, password: string): Promise<User> => {
    const response = await apiRequest("POST", "/api/auth/login", { username, password });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "فشل تسجيل الدخول");
    }
    
    const user = await response.json();
    queryClient.setQueryData(['/api/auth/current-user'], user);
    
    // Invalidate any queries that might depend on authentication
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    
    return user;
  },

  // Register a new user
  register: async (userData: any): Promise<User> => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "فشل إنشاء الحساب");
    }
    
    const user = await response.json();
    queryClient.setQueryData(['/api/auth/current-user'], user);
    
    return user;
  },

  // Logout the current user
  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
    
    // Clear user data and any authenticated queries
    queryClient.setQueryData(['/api/auth/current-user'], null);
    queryClient.clear();
  },

  // Check if the user has a specific role (e.g. "teacher")
  hasRole: async (role: string): Promise<boolean> => {
    const user = await authUtils.getCurrentUser();
    return user?.role === role;
  }
};

export default authUtils;
