'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/components/toast';
import {
  Activity,
  Plus,
  Search,
  Power,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
  LogOut,
  Sun,
  Moon,
  AlertCircle,
  Database,
  Globe,
  Settings,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Website {
  id: string;
  website_name: string;
  website_url: string;
  schedule_minutes: number;
  enabled: boolean;
  last_ping_at: string | null;
  next_ping_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, dbUser, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [websites, setWebsites] = useState<Website[]>([]);
  const [loaderEmoji, setLoaderEmoji] = useState('😴');
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoaderEmoji((prev) => (prev === '😴' ? '👀' : '😴'));
    }, 850);
    return () => clearInterval(interval);
  }, []);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);

  // Form States
  const [nameInput, setNameInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [scheduleSelect, setScheduleSelect] = useState('15'); // default 15 mins
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const [enabledInput, setEnabledInput] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Sync / Auth Check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Fetch Websites
  const fetchWebsites = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/websites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWebsites(data.websites);
      } else {
        toast.error('Failed to load websites list.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to server.');
    } finally {
      setFetching(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token && dbUser) {
      fetchWebsites();
    }
  }, [token, dbUser, fetchWebsites]);

  // Open Add Modal
  const openAddModal = () => {
    setNameInput('');
    setUrlInput('');
    setScheduleSelect('15');
    setCustomMinutesInput('');
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (website: Website) => {
    setSelectedWebsite(website);
    setNameInput(website.website_name);
    setUrlInput(website.website_url);
    const standardSchedules = ['5', '10', '15', '30', '60', '480', '600'];
    const minsStr = website.schedule_minutes.toString();
    
    if (standardSchedules.includes(minsStr)) {
      setScheduleSelect(minsStr);
      setCustomMinutesInput('');
    } else {
      setScheduleSelect('custom');
      setCustomMinutesInput(minsStr);
    }
    setEnabledInput(website.enabled);
    setIsEditOpen(true);
  };

  // Open Delete Confirmation
  const openDeleteModal = (website: Website) => {
    setSelectedWebsite(website);
    setIsDeleteOpen(true);
  };

  // Close All Modals
  const closeModals = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedWebsite(null);
    setFormSubmitting(false);
  };

  // Calculate schedule minutes from input
  const getScheduleMinutes = (): number => {
    if (scheduleSelect === 'custom') {
      return parseInt(customMinutesInput, 10);
    }
    return parseInt(scheduleSelect, 10);
  };

  // Form Validations
  const validateForm = (name: string, url: string, minutes: number): boolean => {
    if (!name.trim()) {
      toast.error('Please enter a website name.');
      return false;
    }
    if (!url.trim()) {
      toast.error('Please enter a website URL.');
      return false;
    }
    const minMinutes = dbUser?.is_pro ? 5 : 10;
    if (isNaN(minutes) || minutes < minMinutes || minutes > 1440) {
      toast.error(`Schedule minutes must be an integer between ${minMinutes} and 1440 (24 hours).`);
      return false;
    }
    return true;
  };

  // Handle Add Website Save
  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = getScheduleMinutes();
    if (!validateForm(nameInput, urlInput, minutes)) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          website_name: nameInput,
          website_url: urlInput,
          schedule_minutes: minutes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${nameInput} added successfully!`);
        fetchWebsites();
        closeModals();
      } else {
        toast.error(data.error || 'Failed to add website.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit Website Save
  const handleEditWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebsite) return;

    const minutes = getScheduleMinutes();
    if (!validateForm(nameInput, urlInput, minutes)) return;

    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/websites/${selectedWebsite.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          website_name: nameInput,
          website_url: urlInput,
          schedule_minutes: minutes,
          enabled: enabledInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Website updated successfully.');
        fetchWebsites();
        closeModals();
      } else {
        toast.error(data.error || 'Failed to update website.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Enable / Disable Toggle directly on Card
  const handleToggleStatus = async (website: Website) => {
    setTogglingIds(prev => [...prev, website.id]);
    try {
      const res = await fetch(`/api/websites/${website.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !website.enabled,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${website.website_name} has been ${!website.enabled ? 'enabled' : 'disabled'}.`);
        // Fast local state update for snappy feel
        setWebsites(prev =>
          prev.map(w => (w.id === website.id ? { ...w, enabled: !website.enabled } : w))
        );
        fetchWebsites(); // Re-sync background details (like next_ping_at)
      } else {
        toast.error(data.error || 'Failed to change status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred.');
    } finally {
      setTogglingIds(prev => prev.filter(id => id !== website.id));
    }
  };

  // Handle Delete Confirmation
  const handleDeleteWebsite = async () => {
    if (!selectedWebsite) return;

    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/websites/${selectedWebsite.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${selectedWebsite.website_name} removed successfully.`);
        fetchWebsites();
        closeModals();
      } else {
        toast.error(data.error || 'Failed to remove website.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully.');
      router.push('/');
    } catch (err) {
      toast.error('Failed to log out.');
    }
  };

  // Filter Logic
  const filteredWebsites = websites.filter(
    (w) =>
      w.website_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.website_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalCount = websites.length;
  const activeCount = websites.filter((w) => w.enabled).length;
  const disabledCount = websites.filter((w) => !w.enabled).length;

  const getScheduleLabel = (mins: number) => {
    if (mins === 5) return 'Every 5 Mins';
    if (mins === 10) return 'Every 10 Mins';
    if (mins === 15) return 'Every 15 Mins';
    if (mins === 30) return 'Every 30 Mins';
    if (mins === 60) return 'Every 1 Hour';
    if (mins === 480) return 'Every 8 Hours';
    if (mins === 600) return 'Every 10 Hours';
    if (mins >= 60 && mins % 60 === 0) return `Every ${mins / 60} Hours`;
    return `Every ${mins} Mins`;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (authLoading || (!user && !fetching)) {
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
          <p className="text-xs font-bold text-primary tracking-widest uppercase animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      
      {/* Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 select-none">
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-primary">WakeUp</span>
              <span className="text-foreground">Site</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="h-9 w-9 rounded-full bg-primary hover:bg-orange-600 flex items-center justify-center text-black font-bold text-sm shadow-md transition-all duration-200 border border-border/10 focus:outline-none"
                aria-label="Account Menu"
              >
                {user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <>
                    {/* Backdrop to close dropdown on click outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-72 rounded-xl border border-border bg-card/95 backdrop-blur-md text-card-foreground shadow-xl z-50 p-4 focus:outline-none"
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-black font-bold text-base">
                          {user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-semibold truncate">
                            {user?.displayName || 'User'}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="py-3 border-b border-border space-y-2.5 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Last Logged In:</span>
                          <span className="font-medium text-muted-foreground/80 break-words">
                            {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                        className="w-full mt-3 py-2 px-3 text-xs font-semibold text-rose-500 hover:text-white border border-rose-500/20 hover:bg-rose-500 hover:border-rose-500 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome, {user?.displayName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your website schedules and keep your services responsive.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="sm:self-center px-4 py-2.5 text-sm font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4.5 w-4.5" /> Add Website
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1 */}
          <div className="p-6 rounded-xl border border-orange-500/10 hover:border-orange-500/30 bg-card text-card-foreground shadow-ambient-orange hover:shadow-ambient-orange-hover transition-all duration-300 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-primary flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Websites</p>
              <h3 className="text-2xl font-extrabold mt-0.5">{fetching ? '...' : totalCount}</h3>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl border border-orange-500/10 hover:border-orange-500/30 bg-card text-card-foreground shadow-ambient-orange hover:shadow-ambient-orange-hover transition-all duration-300 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Websites</p>
              <h3 className="text-2xl font-extrabold mt-0.5">{fetching ? '...' : activeCount}</h3>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl border border-orange-500/10 hover:border-orange-500/30 bg-card text-card-foreground shadow-ambient-orange hover:shadow-ambient-orange-hover transition-all duration-300 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Power className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disabled Websites</p>
              <h3 className="text-2xl font-extrabold mt-0.5">{fetching ? '...' : disabledCount}</h3>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative w-full flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search websites by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Website List Content */}
        {fetching ? (
          /* Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-6 rounded-xl border border-border bg-card animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted rounded" />
                </div>
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="h-5 w-24 bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredWebsites.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
            <div className="h-14 w-14 rounded-full bg-orange-500/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Globe className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold">No websites monitored</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
              {searchQuery ? 'No websites match your search queries.' : 'Add your first deployment to begin scheduling periodic health checks.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="px-4 py-2 text-sm font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 shadow-md transition-all flex items-center gap-1.5 mx-auto"
              >
                <Plus className="h-4 w-4" /> Add Website
              </button>
            )}
          </div>
        ) : (
          /* Grid list of cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredWebsites.map((web) => (
                <motion.div
                  key={web.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-6 rounded-xl border bg-card text-card-foreground flex flex-col justify-between transition-all duration-300 ${
                    !web.enabled
                      ? 'border-border opacity-75 shadow-sm'
                      : 'border-orange-500/20 hover:border-orange-500/40 shadow-ambient-orange hover:shadow-ambient-orange-hover'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-base truncate flex-1" title={web.website_name}>
                        {web.website_name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          web.enabled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        {web.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    {/* URL */}
                    <a
                      href={web.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mb-4 w-fit"
                    >
                      <span className="truncate max-w-[200px]" title={web.website_url}>
                        {web.website_url}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>

                    {/* Schedule */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Schedule:</span>
                      <span className="font-semibold text-foreground">
                        {getScheduleLabel(web.schedule_minutes)}
                      </span>
                    </div>
                  </div>

                  {/* Actions / Timestamps footer */}
                  <div className="pt-4 border-t border-border mt-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground mb-4">
                      <div>
                        <p className="font-semibold uppercase tracking-wider text-[8px]">Last Ping</p>
                        <p className="text-foreground mt-0.5 truncate">{formatDateTime(web.last_ping_at)}</p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-wider text-[8px]">Next Ping</p>
                        <p className="text-foreground mt-0.5 truncate">
                          {web.enabled ? formatDateTime(web.next_ping_at) : 'Paused'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStatus(web)}
                        disabled={togglingIds.includes(web.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          togglingIds.includes(web.id)
                            ? 'border-border bg-muted/20 opacity-60 cursor-not-allowed text-muted-foreground'
                            : (web.enabled
                                ? 'border-slate-500/20 hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-300'
                                : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10')
                        }`}
                      >
                        {togglingIds.includes(web.id) ? (
                          <motion.span
                            key={loaderEmoji}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-xs select-none"
                          >
                            {loaderEmoji}
                          </motion.span>
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                        {togglingIds.includes(web.id) ? 'Toggling...' : (web.enabled ? 'Disable' : 'Enable')}
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEditModal(web)}
                          className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit Settings"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(web)}
                          className="p-1.5 rounded-lg border border-border hover:bg-secondary hover:text-rose-500 transition-colors text-muted-foreground"
                          title="Remove website"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Add Website Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModals}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            {/* Card Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card text-card-foreground border border-border shadow-xl rounded-2xl overflow-hidden p-6 z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Add Website to Wake Up Always</h3>
                <button onClick={closeModals} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddWebsite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="add-name">
                    Website Name
                  </label>
                  <input
                    id="add-name"
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="My Application Dashboard"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="add-url">
                    Website URL
                  </label>
                  <input
                    id="add-url"
                    type="text"
                    required
                    value={urlInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUrlInput(val);
                      if (val.toLowerCase().includes('.streamlit.app')) {
                        if (scheduleSelect !== '480' && scheduleSelect !== '600') {
                          setScheduleSelect('480');
                        }
                      }
                    }}
                    placeholder="https://my-app.render.com"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  {urlInput.toLowerCase().includes('.streamlit.app') && (
                    <p className="text-[11px] text-orange-500 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Streamlit URL detected: Limited strictly to 8 or 10 hours to protect limits.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="add-schedule">
                    Wake-up Schedule
                  </label>
                  <select
                    id="add-schedule"
                    value={scheduleSelect}
                    onChange={(e) => setScheduleSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  >
                    {urlInput.toLowerCase().includes('.streamlit.app') ? (
                      <>
                        <option value="480">Every 8 Hours (Recommended)</option>
                        <option value="600">Every 10 Hours</option>
                      </>
                    ) : (
                      <>
                        <option value="5" disabled={!dbUser?.is_pro}>
                          Every 5 Minutes {!dbUser?.is_pro && "(Pro Only)"}
                        </option>
                        <option value="10">Every 10 Minutes</option>
                        <option value="15">Every 15 Minutes</option>
                        <option value="30">Every 30 Minutes</option>
                        <option value="60">Every 1 Hour</option>
                        <option value="480">Every 8 Hours (Recommended for Streamlit)</option>
                        <option value="custom">Custom</option>
                      </>
                    )}
                  </select>
                </div>

                {scheduleSelect === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="add-custom-mins">
                      Custom Minutes
                    </label>
                    <input
                      id="add-custom-mins"
                      type="number"
                      required
                      min={dbUser?.is_pro ? "5" : "10"}
                      max="1440"
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      placeholder={dbUser?.is_pro ? "Minutes (5 to 1440)" : "Minutes (10 to 1440)"}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Minimum {dbUser?.is_pro ? "5" : "10"} minutes required for your tier.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 text-sm font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 flex items-center gap-1 shadow"
                  >
                    {formSubmitting && <Loader2 className="h-4 w-4 animate-spin text-black" />}
                    Save Website
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Website Modal */}
      <AnimatePresence>
        {isEditOpen && selectedWebsite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModals}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            {/* Card Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card text-card-foreground border border-border shadow-xl rounded-2xl overflow-hidden p-6 z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Edit website configuration</h3>
                <button onClick={closeModals} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditWebsite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="edit-name">
                    Website Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="My Application Dashboard"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="edit-url">
                    Website URL
                  </label>
                  <input
                    id="edit-url"
                    type="text"
                    required
                    value={urlInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUrlInput(val);
                      if (val.toLowerCase().includes('.streamlit.app')) {
                        if (scheduleSelect !== '480' && scheduleSelect !== '600') {
                          setScheduleSelect('480');
                        }
                      }
                    }}
                    placeholder="https://my-app.render.com"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  {urlInput.toLowerCase().includes('.streamlit.app') && (
                    <p className="text-[11px] text-orange-500 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Streamlit URL detected: Limited strictly to 8 or 10 hours to protect limits.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="edit-schedule">
                    Wake-up Schedule
                  </label>
                  <select
                    id="edit-schedule"
                    value={scheduleSelect}
                    onChange={(e) => setScheduleSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  >
                    {urlInput.toLowerCase().includes('.streamlit.app') ? (
                      <>
                        <option value="480">Every 8 Hours (Recommended)</option>
                        <option value="600">Every 10 Hours</option>
                      </>
                    ) : (
                      <>
                        <option value="5" disabled={!dbUser?.is_pro}>
                          Every 5 Minutes {!dbUser?.is_pro && "(Pro Only)"}
                        </option>
                        <option value="10">Every 10 Minutes</option>
                        <option value="15">Every 15 Minutes</option>
                        <option value="30">Every 30 Minutes</option>
                        <option value="60">Every 1 Hour</option>
                        <option value="480">Every 8 Hours (Recommended for Streamlit)</option>
                        <option value="custom">Custom</option>
                      </>
                    )}
                  </select>
                </div>

                {scheduleSelect === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase" htmlFor="edit-custom-mins">
                      Custom Minutes
                    </label>
                    <input
                      id="edit-custom-mins"
                      type="number"
                      required
                      min={dbUser?.is_pro ? "5" : "10"}
                      max="1440"
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      placeholder={dbUser?.is_pro ? "Minutes (5 to 1440)" : "Minutes (10 to 1440)"}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Minimum {dbUser?.is_pro ? "5" : "10"} minutes required for your tier.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    id="edit-enabled"
                    type="checkbox"
                    checked={enabledInput}
                    onChange={(e) => setEnabledInput(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 bg-background"
                  />
                  <label htmlFor="edit-enabled" className="text-sm font-semibold cursor-pointer">
                    Enable health checks for this URL
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 text-sm font-semibold text-black bg-primary rounded-lg hover:bg-orange-600 flex items-center gap-1 shadow"
                  >
                    {formSubmitting && <Loader2 className="h-4 w-4 animate-spin text-black" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Website Confirmation Modal */}
      <AnimatePresence>
        {isDeleteOpen && selectedWebsite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModals}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            {/* Card Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card text-card-foreground border border-border shadow-xl rounded-2xl overflow-hidden p-6 z-10"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-6">Remove website check?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Are you sure you want to remove this website? This will permanently cancel all scheduled health checks for:
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-2 bg-secondary/50 p-2 rounded border border-border break-all">
                    {selectedWebsite.website_name} ({selectedWebsite.website_url})
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWebsite}
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1 shadow"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
