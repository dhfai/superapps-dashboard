// API Service untuk Authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  retype_password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyRegistrationData {
  email: string;
  otp_code: string;
}

export interface ResendOTPData {
  email: string;
}

export interface ForgetPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp_code: string;
  new_password: string;
}

export interface VerifyEmailData {
  email: string;
  otp_code: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface UserProfile {
  full_name: string;
  address: string;
  phone_number: string;
  country: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
  email_verified_at: string;
  profile: UserProfile;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Helper function untuk handle fetch dengan error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        error: data.error,
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Authentication Service
export const authService = {
  // Register - Memulai proses registrasi
  async register(data: RegisterData): Promise<ApiResponse> {
    return fetchAPI('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify Registration - Menyelesaikan registrasi dengan OTP
  async verifyRegistration(data: VerifyRegistrationData): Promise<ApiResponse<User>> {
    return fetchAPI('/api/v1/auth/verify-registration', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Resend Registration OTP
  async resendRegistrationOTP(data: ResendOTPData): Promise<ApiResponse> {
    return fetchAPI('/api/v1/auth/resend-registration-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Login
  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    return fetchAPI('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify Email (untuk user yang sudah terdaftar)
  async verifyEmail(data: VerifyEmailData): Promise<ApiResponse> {
    return fetchAPI('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Resend Verification (untuk user yang sudah terdaftar)
  async resendVerification(data: ResendOTPData): Promise<ApiResponse> {
    return fetchAPI('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Forget Password
  async forgetPassword(data: ForgetPasswordData): Promise<ApiResponse> {
    return fetchAPI('/api/v1/auth/forget-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reset Password
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    return fetchAPI('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Logout (requires authentication)
  async logout(token: string): Promise<ApiResponse> {
    return fetchAPI('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get User Info (requires authentication)
  async getUserInfo(token: string): Promise<ApiResponse<User>> {
    return fetchAPI('/api/v1/user/info', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Token Management
export const tokenService = {
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      // Set cookie untuk middleware (expires in 7 days)
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Remove cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },
};

// User Data Management
export const userService = {
  setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user));
    }
  },

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  removeUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
    }
  },

  clearAll() {
    tokenService.removeToken();
    this.removeUser();
    // Also clear cookie
    if (typeof window !== 'undefined') {
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },
};
