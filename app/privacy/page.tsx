'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* Header Panel */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <Link href="/" className="flex items-center gap-1 select-none">
          <span className="text-lg font-extrabold tracking-tight">
            <span className="text-primary">WakeUp</span>
            <span className="text-foreground">Site</span>
          </span>
        </Link>
      </header>

      {/* Content Body */}
      <main className="flex-grow flex items-center justify-center p-6 py-16">
        <div className="w-full max-w-2xl bg-card border border-orange-500/20 shadow-ambient-orange hover:shadow-ambient-orange-hover hover:border-orange-500/30 transition-all duration-300 rounded-2xl p-8 sm:p-12">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-primary flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Last updated: January 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-base font-bold text-foreground mb-2">1. Information We Collect</h2>
              <p>
                To provide our automated website health check scheduling services, we collect basic details:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
                <li>Account details (email address and login credentials via Google Auth).</li>
                <li>Monitored websites (schedules, target URLs, and connection responses).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">2. How We Use Information</h2>
              <p>
                We use the data collected to manage health schedules, ping endpoints exactly at scheduled intervals, update active website statistics, and secure access to your profile panel.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">3. Data Integrity & Safety</h2>
              <p>
                All data, URLs, and login sessions are safeguarded securely. We do not sell user profiles or target website information to third-party advert providers.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">4. Third-Party Connections</h2>
              <p>
                Our services deploy checks outward to host URLs specified by users (e.g. Render, Railway, Fly.io). No API credentials or access tokens for these targets are collected.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">5. Updates to This Policy</h2>
              <p>
                We reserve the right to modify this Privacy Policy at any time. Changes will be posted dynamically on this link interface.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
