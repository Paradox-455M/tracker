"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Wallet, BarChart3, Target, Bot } from "lucide-react";
import dashboardImg from "@/assets/dashboard.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(20,184,166,0.35),transparent_60%),radial-gradient(900px_500px_at_10%_-10%,rgba(124,252,0,0.25),transparent_60%),#0A0A0A] text-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-5xl md:text-7xl font-extrabold leading-tight">
            Master Your Money with <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Fintrack</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.5 }} className="mt-5 text-gray-300 text-lg max-w-xl">
            Track expenses, set goals, and grow your savings — all in one intelligent finance app.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} className="mt-8 flex gap-4">
            <Link href="/login" className="rounded-xl shadow-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-black px-6 py-3 text-base font-semibold">
              Start Free
            </Link>
            <a href="#demo" className="rounded-xl border border-white/20 px-6 py-3 text-base hover:bg-white/5">
              See How It Works
            </a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative">
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-card bg-white/5">
            <Image src={dashboardImg} alt="Dashboard preview" className="w-full h-auto" priority />
          </div>
          <div className="absolute -z-10 -top-8 -right-8 blur-3xl w-64 h-64 rounded-full bg-[var(--primary)]/20" />
        </motion.div>
      </section>

      {/* Quick Highlights */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="highlights">
        {[
          { icon: <Wallet size={18} />, title: "Expense Tracking" },
          { icon: <BarChart3 size={18} />, title: "Financial Reports" },
          { icon: <Target size={18} />, title: "Goal Setting" },
          { icon: <Bot size={18} />, title: "AI Insights" },
        ].map((f) => (
          <motion.div key={f.title} whileHover={{ y: -3 }} className="rounded-2xl p-6 bg-gray-900 hover:bg-gray-800 transition shadow-lg border border-white/5">
            <div className="text-[var(--primary)]">{f.icon}</div>
            <div className="mt-2 font-semibold">{f.title}</div>
          </motion.div>
        ))}
      </section>

      {/* Visual Demo */}
      <section id="demo" className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-card bg-white/5">
          <Image src={dashboardImg} alt="App preview" className="w-full h-auto" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">How Fintrack Works</h2>
          <ol className="mt-6 space-y-4">
            {[
              "Connect accounts",
              "Track & categorize spending",
              "Get AI-driven insights",
              "Achieve goals faster",
            ].map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary)] text-black text-sm font-bold">{idx + 1}</span>
                <span className="text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          "Save time with automated tracking",
          "Make smarter financial decisions",
          "Get personalized insights",
          "Stay motivated with weekly reports",
        ].map((b) => (
          <motion.div key={b} whileHover={{ scale: 1.02 }} className="rounded-2xl p-6 bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 hover:from-gray-800 hover:to-gray-900 transition shadow-lg">
            <div className="text-gray-200 font-medium">{b}</div>
          </motion.div>
        ))}
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[1,2,3].map((i) => (
          <div key={i} className="rounded-2xl p-6 bg-gray-900 border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="text-sm text-gray-300">User {i}</div>
            </div>
            <p className="mt-3 text-gray-400 text-sm">“Fintrack helped me save 20% more each month!”</p>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h3 className="text-3xl md:text-4xl font-extrabold">Ready to take control of your finances?</h3>
        <div className="mt-6">
          <Link href="/login" className="inline-flex rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-black px-8 py-4 text-base font-semibold shadow-lg">
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-sm text-gray-400">
        <nav className="mb-3 space-x-4">
          <a href="#highlights" className="hover:text-white">Features</a>
          <a href="#" className="hover:text-white">Blog</a>
          <a href="#" className="hover:text-white">FAQ</a>
          <a href="#" className="hover:text-white">Contact</a>
        </nav>
        <div>Fintrack — Your AI-powered finance companion.</div>
      </footer>
    </div>
  );
}
