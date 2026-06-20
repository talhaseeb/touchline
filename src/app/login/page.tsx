"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { DbInit } from "@/components/DbInit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { username: "admin",   password: "touchline-admin",   role: "Admin",   icon: "⚙️" },
  { username: "coach",   password: "touchline-coach",   role: "Coach",   icon: "📋" },
  { username: "captain", password: "touchline-captain", role: "Captain", icon: "🏆" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = await login(username.trim(), password);
    setLoading(false);
    if (!user) { toast.error("Invalid username or password"); return; }
    router.replace("/dashboard");
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <>
      <DbInit />
      <div className="min-h-screen flex flex-col md:flex-row bg-background">

        {/* Left panel – branding */}
        <div className="hidden md:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-[#0d1f12] via-[#0a2e14] to-[#0f172a] p-10 relative overflow-hidden">
          {/* Pitch lines decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-white" />
            <div className="absolute top-0 left-0 right-0 h-1/3 border-b-2 border-white" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 border-t-2 border-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                <FootballIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">Touchline</span>
            </div>
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Smarter decisions<br />
              <span className="text-primary">from the touchline.</span>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Real-time match analysis, player ratings, and substitution intelligence — built for coaches who win.
            </p>
          </div>

          <div className="relative z-10 flex gap-6">
            {["Live Events", "Auto Ratings", "Match Reports"].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-white/60 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel – form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <FootballIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Touchline</span>
          </div>

          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-sm mb-8">Sign in to your coaching dashboard</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="h-12 bg-card border-border focus:border-primary text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="h-12 bg-card border-border focus:border-primary text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Demo Accounts</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <span className="text-lg">{acc.icon}</span>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">{acc.role}</p>
                      <p className="text-xs text-muted-foreground">{acc.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3C12 3 9 7 9 12C9 17 12 21 12 21" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3C12 3 15 7 15 12C15 17 12 21 12 21" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12H21" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 16H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
