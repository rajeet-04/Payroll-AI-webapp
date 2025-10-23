import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, BarChart3, Brain, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            <span className="text-2xl font-bold">Payroll AI</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Modern Payroll
              <span className="text-primary block mt-2">Powered by AI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your payroll processing with intelligent automation,
              real-time insights, and seamless employee management.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" asChild className="text-lg h-12 px-8">
              <Link href="/login">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg h-12 px-8">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Get instant answers about payroll, deductions, and compensation
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Automated Processing</h3>
            <p className="text-sm text-muted-foreground">
              Process payroll in minutes with intelligent automation
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Compliant</h3>
            <p className="text-sm text-muted-foreground">
              Bank-level security with full compliance management
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Detect anomalies and gain insights with AI-powered analysis
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center space-y-4 p-12 rounded-2xl bg-primary text-primary-foreground">
          <h2 className="text-3xl font-bold">Ready to revolutionize your payroll?</h2>
          <p className="text-lg opacity-90">
            Join modern companies using AI to simplify their payroll operations
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-4">
            <Link href="/login">Get Started Today</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="font-semibold">Payroll AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Payroll AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
