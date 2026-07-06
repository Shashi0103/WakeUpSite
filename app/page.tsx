'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useTheme } from '@/components/theme-provider';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Moon,
  Sun,
  Zap,
  Shield,
  Layers,
  HelpCircle,
  ChevronDown,
  Heart,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [emojiState, setEmojiState] = React.useState<'sleeping' | 'waking'>('sleeping');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setEmojiState((prev) => (prev === 'sleeping' ? 'waking' : 'sleeping'));
    }, 2800);
    return () => clearInterval(interval);
  }, []);


  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 select-none">
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-primary">WakeUp</span>
              <span className="text-foreground">Site</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {loading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
              >
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth?signup=true"
                  className="px-4 py-2 text-sm font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          {/* Subtle gradient background mesh */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-20 dark:opacity-30 blur-[100px] bg-primary/20 -z-10 rounded-full" />
          
          <div className="max-w-4xl mx-auto px-6 text-center">
            {/* Sleeping/Waking Brand Header Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-1.5 mb-5"
            >
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-4xl sm:text-5.5xl font-black tracking-tight select-none">
                  <span className="text-primary">WakeUp</span>
                  <span className="text-foreground">Site</span>
                </span>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={emojiState}
                    initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0.5, rotate: 30, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 15 }}
                    className="text-4xl sm:text-5.5xl select-none"
                  >
                    {emojiState === 'sleeping' ? '😴' : '👀'}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Status indicator subtitle */}
              <div className="h-4 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {emojiState === 'sleeping' ? (
                    <motion.span
                      key="sleeping"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="text-[9px] sm:text-[10px] font-bold text-primary/60 tracking-widest uppercase select-none"
                    >
                      zZz... (Idle state)
                    </motion.span>
                  ) : (
                    <motion.span
                      key="active"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="text-[9px] sm:text-[10px] font-black text-emerald-500 tracking-wider uppercase select-none"
                    >
                      Pinging Active!
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-primary border border-primary/20 backdrop-blur-md mb-6">
                <Zap className="h-3 w-3 fill-primary text-primary" /> Keeping Deployments Active
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-tight sm:leading-none text-foreground"
            >
              Keep your deployments awake and{' '}
              <span className="text-primary">
                responsive, always.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Prevent inactivity sleep and idle spin-down delays on your deployed websites with customizable scheduled health checks.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {loading ? (
                <div className="h-12 w-40 bg-muted animate-pulse rounded-lg" />
              ) : user ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  View Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth?signup=true"
                    className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/auth"
                    className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Log In
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-28 border-t border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Designed to keep your apps responsive
              </h2>
              <p className="text-muted-foreground">
                Avoid long spin-up times for free tier hostings like Render, Railway, or Fly.io.
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Feature 1 */}
              <motion.div
                variants={itemVariants}
                className="p-8 rounded-2xl border border-orange-500/20 bg-card text-card-foreground shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/40 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-primary flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Custom Schedules</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ping every 5, 10, 15, 30 minutes, or set custom intervals. Ensure your host never enters sleep state.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                variants={itemVariants}
                className="p-8 rounded-2xl border border-orange-500/20 bg-card text-card-foreground shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/40 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-primary flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Simple Dashboard</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track all your domains in one central dashboard. Instantly enable, disable, edit or delete checks.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                variants={itemVariants}
                className="p-8 rounded-2xl border border-orange-500/20 bg-card text-card-foreground shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/40 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-primary flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Immediate Responses</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fast backend architecture handles health checks exactly on time, ensuring high reliability.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 sm:py-28 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Setup in three easy steps
              </h2>
              <p className="text-muted-foreground">
                Get up and running in under a minute. No credit card required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full border border-orange-500/20 bg-background shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/40 transition-all duration-300 flex items-center justify-center text-lg font-bold text-primary">
                  1
                </div>
                <h3 className="text-lg font-bold">Register Account</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Create a secure account with Google Login or standard Email and Password.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full border border-orange-500/20 bg-background shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/40 transition-all duration-300 flex items-center justify-center text-lg font-bold text-primary">
                  2
                </div>
                <h3 className="text-lg font-bold">Add Website URL</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Input your deployed application endpoint and select a wake-up schedule.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full border border-orange-500/20 bg-background shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/40 transition-all duration-300 flex items-center justify-center text-lg font-bold text-primary">
                  3
                </div>
                <h3 className="text-lg font-bold">Stay Online</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Our scheduler will dispatch periodic HTTP GET requests to keep the server hot.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Streamlit & Hugging Face Guide Callout */}
        <section className="py-12 border-t border-border bg-primary/5">
          <div className="max-w-4xl mx-auto px-6">
            <div className="p-6 sm:p-8 rounded-2xl border border-orange-500/20 bg-background/50 backdrop-blur-md shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/40 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-primary flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-2">
                    Special Note for Streamlit Cloud & Community Apps
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Streamlit Community Cloud puts apps into a deep hibernation state with a static &quot;Wake up&quot; button that normal ping tools cannot trigger. We support two methods to keep them active:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-secondary/40 rounded-xl p-4 text-xs space-y-1.5 border border-border">
                      <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Option 1: Rehost on Render / Railway</h4>
                      <p className="text-muted-foreground leading-normal">
                        Redeploy your Streamlit app on a free hosting platform like <strong>Render</strong> or <strong>Railway</strong> and paste the link here. Since they run standard containers, they wake up instantly via normal HTTP pings.
                      </p>
                    </div>

                    <div className="bg-secondary/40 rounded-xl p-4 text-xs space-y-1.5 border border-border">
                      <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Option 2: Direct Streamlit Link (Headless Browser)</h4>
                      <p className="text-muted-foreground leading-normal">
                        Paste your Streamlit link directly! To protect free cloud resources, Streamlit URLs are strictly restricted to an <strong>8 to 10 hour interval</strong>. This is fully sufficient since Streamlit apps only hibernate after 12 hours of total inactivity. Our system will automatically launch a headless cloud browser to click the wake button for you!
                      </p>
                    </div>

                    <div className="bg-secondary/40 rounded-xl p-4 text-xs space-y-1.5 border border-border">
                      <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Option 3: Hugging Face Spaces & Gradio</h4>
                      <p className="text-muted-foreground leading-normal">
                        For Hugging Face Spaces, paste your Space URL directly and choose a standard schedule (like <strong>Every 1 Hour</strong>). Our regular pings generate constant HTTP traffic, which is fully sufficient to prevent Hugging Face from entering its sleep state!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 sm:py-28 border-t border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground">
                Start for free today. Upgrade when you need more power.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="p-8 rounded-2xl border border-orange-500/20 hover:border-orange-500/40 bg-card text-card-foreground relative overflow-hidden flex flex-col justify-between shadow-ambient-orange hover:shadow-ambient-orange-hover transition-all duration-300">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Free</h3>
                  <p className="text-sm text-muted-foreground mb-6">Essential ping schedules for individual developers.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">₹0</span>
                    <span className="text-muted-foreground text-sm"> / month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Up to 5 websites</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Custom wake-up schedule (min. 10 mins)</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Basic monitoring dashboard</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/auth?signup=true"
                  className="w-full py-2.5 text-center text-sm font-semibold border border-border hover:bg-secondary rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro Plan (Coming Soon) */}
              <div className="p-8 rounded-2xl border border-orange-500/30 hover:border-orange-500/50 bg-card text-card-foreground relative overflow-hidden flex flex-col justify-between shadow-ambient-orange hover:shadow-ambient-orange-hover transition-all duration-300">
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-black text-[10px] font-bold tracking-wider uppercase rounded-bl-lg">
                  Coming Soon
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <p className="text-sm text-muted-foreground mb-6">Advanced health logs and team monitoring utilities.</p>
                  <div className="mb-6 flex flex-col gap-1.5">
                    <div>
                      <span className="text-4xl font-extrabold">₹99</span>
                      <span className="text-muted-foreground text-sm"> / month</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      or <span className="font-semibold text-foreground">₹999</span> / year
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Unlimited websites</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Custom wake-up schedule (min. 5 mins)</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Advanced monitoring & down alerts</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Email, Discord & Telegram notifications</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Team workspaces & analytics</span>
                    </li>
                  </ul>
                </div>
                <button
                  disabled
                  className="w-full py-2.5 text-center text-sm font-semibold text-black bg-primary opacity-60 rounded-lg cursor-not-allowed"
                >
                  Join Waitlist
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 sm:py-28 border-t border-border">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Got questions? We have answers.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'Why do I need to schedule pings to my website?',
                  a: 'Many cloud hosting providers (like Render, Railway, Fly.io, and Glitch) put applications on a "free tier" to sleep after 15–30 minutes of inactivity. When a new visitor goes to your site, they experience a 10–30 second delay (spin-up time). WakeUpSite keeps your deployments active by sending light periodic requests.',
                },
                {
                  q: 'What schedule interval should I use?',
                  a: 'For most hosting providers, a check every 10 or 15 minutes is sufficient to prevent the service from putting your container to sleep. We offer custom schedules between 5 minutes and 1440 minutes (24 hours).',
                },
                {
                  q: 'Does this impact my application analytics?',
                  a: 'Yes, health check pings appear as standard HTTP GET requests in your server logs. However, because our worker sends them cleanly, they do not trigger browser trackers like Google Analytics.',
                },
                {
                  q: 'How does the background worker function?',
                  a: 'Our background worker processes pings using a highly available scheduler. It queries PostgreSQL every minute for active checks that are due, executes the HTTP GET request, and schedules the next execution time.',
                },
                {
                  q: 'Can WakeUpSite wake up Streamlit Cloud or Hugging Face Spaces?',
                  a: 'Yes, but with one condition. Streamlit Cloud and Hugging Face require manual button clicks once they go to sleep. To keep them online: wake up your application manually once, copy the active URL, add it to WakeUpSite, and schedule checks every 10–15 minutes. This creates active traffic and prevents the site from ever going to sleep!',
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="border border-border rounded-xl bg-card overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between font-bold text-left transition-colors hover:bg-secondary/40"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3 bg-secondary/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6 text-center">
          <Link href="/" className="flex items-center gap-1 select-none">
            <span className="text-sm font-extrabold tracking-tight">
              <span className="text-primary">WakeUp</span>
              <span className="text-foreground">Site</span>
            </span>
          </Link>

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} WakeUpSite. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/90 font-medium flex items-center justify-center gap-1 mt-0.5">
              Made with{' '}
              <motion.span
                animate={{ scale: [1, 1.25, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                className="inline-flex items-center select-none"
              >
                <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
              </motion.span>{' '}
              for developers worldwide by{' '}
              <span className="font-extrabold text-primary">
                Shashi Kumar Sahu
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-border">•</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <div className="hidden sm:block text-border">|</div>
            <div className="flex items-center gap-4">
              <a 
                href="mailto:shashisahu0203@gmail.com" 
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="Email Me Directly"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Contact</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/shashi-kumar-583564291" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="LinkedIn Profile"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
