'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Last updated: January 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-base font-bold text-foreground mb-2">1. Agreement to Terms</h2>
              <p>
                By registering an account with WakeUpSite, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">2. Acceptable Use Policy</h2>
              <p>
                You may use our platform only to dispatch scheduled uptime health checks to endpoints that you own or have explicit authorization to ping. You must not use this service to perform DDoS attacks or span pings to unconsenting web hosts.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">3. Service Availability</h2>
              <p>
                While we strive for high service reliability, WakeUpSite pings are dispatched on a best-effort basis. We are not responsible for any target server downtime, loss of profit, or platform suspension from hosting providers resulting from your use of this scheduler.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">4. User Account Obligations</h2>
              <p>
                You are responsible for maintaining the confidentiality of your session tokens, passwords, and account information. You agree to notify us immediately of any unauthorized breach.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">5. Limitations of Liability</h2>
              <p>
                In no event will WakeUpSite or its operators be liable for any direct, indirect, incidental, special or consequential damages arising out of your access to or inability to use this platform.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
