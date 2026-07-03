'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { useTheme } from '@/components/theme-provider';
import { Activity, Mail, Lock, User, Sun, Moon, ArrowLeft, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginWithGoogle, loginWithEmail, signUpWithEmail, sendPasswordReset, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [name, setName] = useState('');
  const [loaderEmoji, setLoaderEmoji] = useState('😴');
  const [justSignedUp, setJustSignedUp] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoaderEmoji((prev) => (prev === '😴' ? '👀' : '😴'));
    }, 850);
    return () => clearInterval(interval);
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (isResetMode) {
      if (!trimmedEmail) {
        toast.error('Please enter your email address');
        return;
      }
      setActionLoading(true);
      try {
        await sendPasswordReset(trimmedEmail);
        toast.success('Password reset email sent! Check your inbox (and check your Spam/Junk folder if not found).', 10000);
        setIsResetMode(false);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Failed to send password reset link.');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    if (!email || !password || (isSignUp && !name)) {
      toast.error('Please fill in all fields');
      return;
    }

    setActionLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(name, trimmedEmail, password);
        toast.success('Verification link sent! Check your inbox (and check your Spam/Junk folder if not found).', 10000);
        setIsSignUp(false);
        setJustSignedUp(true);
        setPassword('');
      } else {
        await loginWithEmail(trimmedEmail, password);
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password must be at least 6 characters.';
      }
      toast.error(errMsg, errMsg.includes('verified') ? 10000 : 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setActionLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || (user && !actionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            key={loaderEmoji}
            initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
            animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className="text-5xl select-none"
          >
            {loaderEmoji}
          </motion.div>
          <p className="text-xs font-bold text-primary tracking-widest uppercase animate-pulse">Loading secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Top Header Panel */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card text-card-foreground border border-orange-500/20 shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/30 transition-all duration-300 rounded-2xl p-8">
          
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md mb-3">
              <Zap className="h-6 w-6 text-black fill-black" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              {isResetMode ? 'Reset your password' : (isSignUp ? 'Create your account' : 'Welcome back')}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {isResetMode
                ? 'Enter your email to receive a password reset link'
                : (isSignUp
                    ? 'Register to monitor your deployed websites'
                    : 'Log in to manage your health check schedules')}
            </p>
          </div>

          {/* Social Sign-In */}
          {!isResetMode && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 border border-border rounded-lg bg-background hover:bg-secondary font-semibold text-sm transition-colors flex items-center justify-center gap-2.5 shadow-sm hover:shadow"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Form Divider */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative px-3 bg-card text-xs font-semibold text-muted-foreground uppercase">
                  Or continue with email
                </span>
              </div>
            </>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {justSignedUp && (
              <div className="p-3.5 rounded-lg border border-orange-500/20 bg-orange-500/5 text-xs text-primary leading-normal flex items-start gap-2 mb-4">
                <Zap className="h-4 w-4 shrink-0 mt-0.5 animate-pulse text-primary fill-primary" />
                <div>
                  <span className="font-bold">Verification Email Sent!</span> Check your email inbox to verify your address. If you do not see the email, please check your <span className="font-bold">Spam/Junk folder</span>!
                </div>
              </div>
            )}
            {isSignUp && !isResetMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={actionLoading}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={actionLoading}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {!isResetMode && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="password">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setJustSignedUp(false);
                      }}
                      className="text-xs font-semibold text-primary hover:underline focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={actionLoading}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full mt-2 py-2.5 px-4 font-semibold text-sm text-black bg-primary rounded-lg hover:bg-orange-600 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <motion.span
                  key={loaderEmoji}
                  initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  className="text-base select-none"
                >
                  {loaderEmoji}
                </motion.span>
              ) : null}
              {actionLoading 
                ? (isResetMode ? 'Sending Link...' : (isSignUp ? 'Sending Verification...' : 'Signing In...')) 
                : (isResetMode ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In'))
              }
            </button>
          </form>

           {/* Form Switch Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isResetMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setJustSignedUp(false);
                  setPassword('');
                }}
                className="font-bold text-primary hover:underline focus:outline-none"
              >
                Back to Sign In
              </button>
            ) : isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-bold text-primary hover:underline focus:outline-none"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setJustSignedUp(false);
                  }}
                  className="font-bold text-primary hover:underline focus:outline-none"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
