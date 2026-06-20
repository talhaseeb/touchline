"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { DbInit } from "@/components/DbInit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { username: "admin", password: "touchline-admin", role: "Admin" },
  { username: "coach", password: "touchline-coach", role: "Coach" },
  { username: "captain", password: "touchline-captain", role: "Captain" },
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
    if (!user) {
      toast.error("Invalid username or password");
      return;
    }
    router.replace("/dashboard");
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <>
      <DbInit />
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Touchline</h1>
          <p className="text-muted-foreground text-sm">Smarter decisions from the touchline.</p>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-sm bg-card border-border shadow-2xl">
          <CardHeader className="pb-2">
            <h2 className="text-xl font-semibold text-center">Sign In</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo Accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <span className="text-xs font-medium text-foreground">{acc.role}</span>
                    <span className="text-xs text-muted-foreground">{acc.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
