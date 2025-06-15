import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  userProfile: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const response = await apiService.getCurrentUser();
        setUserProfile(response.data.user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshUserProfile();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (
    email: string,
    password: string,
    username: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Register user in backend
      await apiService.register({
        email,
        password,
        username,
        firstName,
        lastName,
      });

      // Sign out the user after registration so they need to login manually
      await signOut(auth);

      toast({
        title: 'Account created successfully!',
        description: 'Please log in with your new credentials to continue.',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error.response?.data?.message || error.message || 'An error occurred during registration.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      toast({
        title: 'Signed in with Google',
        description: 'Welcome to DebugUnion!',
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: 'Google login failed',
        description: error.message || 'An error occurred during Google login.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loginWithGithub = async () => {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      
      toast({
        title: 'Signed in with GitHub',
        description: 'Welcome to DebugUnion!',
      });
    } catch (error: any) {
      console.error('GitHub login error:', error);
      toast({
        title: 'GitHub login failed',
        description: error.message || 'An error occurred during GitHub login.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      await signOut(auth);
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: error.message || 'An error occurred during logout.',
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      
      toast({
        title: 'Reset link sent!',
        description: 'Check your email for password reset instructions.',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Password reset failed',
        description: error.message || 'An error occurred while sending reset email.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithGithub,
    resetPassword,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
