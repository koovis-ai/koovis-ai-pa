import Link from "next/link";
import {
  MessageSquare,
  Sparkles,
  Shield,
  Mic,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Multi-Model AI",
    desc: "Claude, GPT, and Gemini with intelligent routing. The right model for every query.",
  },
  {
    icon: Sparkles,
    title: "Tool Use",
    desc: "Web search, file analysis, and custom tools. More than just conversation.",
  },
  {
    icon: Mic,
    title: "Voice & Files",
    desc: "Voice input and file uploads. Drop images, PDFs, and documents.",
  },
  {
    icon: Shield,
    title: "Private & Reliable",
    desc: "Your conversations stay yours. Automatic failover keeps things running.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-border">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Koovis
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Your personal AI assistant
          </p>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
            Multi-model AI assistant powered by Claude, GPT, and Gemini.
            Conversation history, tool use, voice input, and file uploads.
            Built for daily use.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open Chat
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 px-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <feature.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://www.koovis.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Koovis AI Pvt Ltd
          </a>
        </p>
      </footer>
    </div>
  );
}
