import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { 
  DEMO_MODE, 
  mockAuthUser, 
  mockEmployees, 
  mockTasks, 
  mockAnnouncements, 
  mockOnboardingChecklists,
  mockDashboardStats,
  mockActivities,
  mockPsychometricTests,
  mockPsychometricQuestions,
  mockTestAttempts
} from "./mockData";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Mock API responses for demo mode
function getMockResponse(url: string, method: string = 'GET') {
  if (!DEMO_MODE) return null;
  
  // Remove leading slash and split by slashes
  const path = url.replace(/^\//, '').split('/');
  
  switch (path.join('/')) {
    case 'api/auth/user':
      return mockAuthUser;
    case 'api/employees':
      return mockEmployees;
    case 'api/tasks':
      return mockTasks;
    case 'api/announcements':
      return mockAnnouncements;
    case 'api/dashboard/stats':
      return mockDashboardStats;
    case 'api/dashboard/activities':
      return mockActivities;
    case 'api/dashboard/approvals':
      return [];
    case 'api/psychometric-tests':
      return mockPsychometricTests;
    case 'api/psychometric-test-attempts':
      return mockTestAttempts;
    default:
      // Handle dynamic routes
      if (path[0] === 'api' && path[1] === 'onboarding' && path[2]) {
        const employeeId = parseInt(path[2]);
        return mockOnboardingChecklists.filter(item => item.employeeId === employeeId);
      }
      return null;
  }
}

// Overloaded function signatures
export async function apiRequest(url: string): Promise<any>;
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response>;
export async function apiRequest(urlOrOptions: any, url?: string, data?: unknown): Promise<any> {
  // Handle single parameter case (GET request)
  if (typeof urlOrOptions === 'string' && !url) {
    // Check for mock response first
    const mockResponse = getMockResponse(urlOrOptions, 'GET');
    if (mockResponse !== null) {
      return Promise.resolve(mockResponse);
    }
    
    const res = await fetch(urlOrOptions, {
      method: 'GET',
      credentials: "include",
    });
    await throwIfResNotOk(res);
    return await res.json();
  }
  
  // Handle object parameter case (with options)
  if (typeof urlOrOptions === 'object' && urlOrOptions.method) {
    const options = urlOrOptions;
    const res = await fetch(options.url || url, {
      method: options.method || 'GET',
      headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers || {},
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      credentials: "include",
    });
    await throwIfResNotOk(res);
    return await res.json();
  }

  // Handle original three parameter case
  const method = urlOrOptions as string;
  
  // Check for mock response first
  const mockResponse = getMockResponse(url!, method);
  if (mockResponse !== null) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) });
  }
  
  const res = await fetch(url!, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Check for mock response first
    const mockResponse = getMockResponse(url, 'GET');
    if (mockResponse !== null) {
      return mockResponse;
    }
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.warn(`Unauthorized access to ${url}. User may need to log in again.`);
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle fetch errors more gracefully
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn(`Network error for ${url}:`, error.message);
        // Don't throw on network errors, let the query handle retries
        throw new Error(`Network error: Unable to connect to server`);
      }
      
      // Handle HTML responses that should be JSON (auth issues)
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        console.warn(`Authentication error for ${url} - received HTML instead of JSON`);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error(`Authentication required: Please refresh the page and log in again`);
      }
      
      console.error(`API error for ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
