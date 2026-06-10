import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check current user session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Session verification failed:', error.message);
          handleLogout();
        }
      }
      setLoading(false);
    };

    checkSession();

    // Listen for unauthorized interceptor events
    const handleUnauthorized = () => {
      handleLogout();
      toast.error('Session expired. Please log in again 🔑');
    };

    window.addEventListener('unauthorized-redirect', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized-redirect', handleUnauthorized);
    };
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      if (res.success) {
        const { token: userToken, ...userData } = res.data;
        setToken(userToken);
        setUser(userData);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success(res.message || 'Logged in successfully! 🎉');
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleRegister = async (userData) => {
    try {
      const res = await authService.register(userData);
      if (res.success) {
        const { token: userToken, ...registeredUser } = res.data;
        setToken(userToken);
        setUser(registeredUser);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(registeredUser));
        toast.success(res.message || 'Registered successfully! 🎉');
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed.';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleGoogleLogin = async (googleData) => {
    try {
      const res = await authService.googleLogin(googleData);
      if (res.success) {
        const { token: userToken, ...userData } = res.data;
        setToken(userToken);
        setUser(userData);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success(res.message || 'Google Login successful! 🎉');
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Google authentication failed.';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const res = await authService.updateProfile(profileData);
      if (res.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        toast.success('Profile updated successfully! 👤');
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Profile update failed.';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleChangePassword = async (passwordData) => {
    try {
      const res = await authService.changePassword(passwordData);
      if (res.success) {
        toast.success(res.message || 'Password changed successfully! 🔐');
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Password change failed.';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        register: handleRegister,
        googleLogin: handleGoogleLogin,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        changePassword: handleChangePassword,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
