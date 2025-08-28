import Header from "@/components/Header";
import FeatureGrid from "@/components/FeatureGrid";
import Accordion from "@/components/Accordion";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-10%,#6ee7b7_0%,transparent_60%),radial-gradient(900px_500px_at_10%_-10%,#6366f1_0%,transparent_60%),#0a0a0a] text-white">
      <Header />

      <section className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-lime-300">
            All-in-One Financial Solution
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Master your Finances with <span className="text-lime-300">Fintrack</span>
          </h1>
          <p className="mt-4 text-gray-300 max-w-xl">
            Track your spending, manage your budget, and achieve your financial goals with ease.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="rounded-full bg-lime-400 text-black px-5 py-3 text-sm font-semibold">
              Start now
            </Link>
            <a href="#features" className="rounded-full border border-white/20 px-5 py-3 text-sm">
              Learn more
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 aspect-video" />
      </section>

      <FeatureGrid />

      <section id="blog" className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 h-72" />
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Achieve Financial Goals Using FinTrack</h2>
          <p className="text-gray-400 text-sm">
            Insights, tips, and the latest on modern personal finance. Read our blog to get the most out of FinTrack.
          </p>
          <Link href="#" className="text-lime-300 text-sm">
            Read article →
          </Link>
        </div>
      </section>

      <section id="faq" className="max-w-6xl mx-auto px-4 py-20">
        <h3 className="text-2xl font-semibold mb-4">Cutting-Edge Features</h3>
        <Accordion
          items={[
            { title: "A11y Optimized", content: "Accessible components and color contrast by default." },
            { title: "Animations & Effects", content: "Subtle gradients, shadows, and motion for a modern feel." },
            { title: "Automated SEO", content: "Clean meta defaults with Next.js metadata API." },
            { title: "Built-in Analytics", content: "Plug in your favorite analytics provider easily." },
            { title: "Sticky Scrolling", content: "Sleek sticky sections and smooth scrolling patterns." },
          ]}
        />
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-gray-400">
        ©2024 Fintrack — All rights reserved.
      </footer>
    </div>
  );
}
