import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileSearch, Gauge, ListChecks, MessagesSquare } from "lucide-react";

import heroImage from "@/assets/hero-placement.jpg";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlaceUp — Resume Score & AI Mock Interviews for Students" },
      {
        name: "description",
        content:
          "Score your resume out of 100, see exactly what to fix to raise its weightage, and practise placement interviews with an AI recruiter.",
      },
      { property: "og:title", content: "PlaceUp — Resume Score & AI Mock Interviews" },
      {
        property: "og:description",
        content:
          "A placement assistance app for students: resume analyser, score detector, improvement tips and AI mock interviews.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileSearch,
    title: "Resume analyser",
    body: "Upload a PDF or paste your resume. We read every line the way a recruiter skims it — in seconds.",
  },
  {
    icon: Gauge,
    title: "Score detector",
    body: "One score out of 100 plus a section-wise breakdown: impact, skills match, structure, clarity, ATS readiness and projects.",
  },
  {
    icon: ListChecks,
    title: "Weightage boosters",
    body: "Prioritised, concrete fixes — rewritten bullet points and the exact keywords your target role expects.",
  },
  {
    icon: MessagesSquare,
    title: "AI mock interviews",
    body: "Nova interviews you from your own resume, probes weak answers, then scores you like a real panel.",
  },
];

function Landing() {
  const { user } = useAuth();
  const primaryTo = user ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={primaryTo}>{user ? "Dashboard" : "Sign in"}</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={primaryTo}>Get started</Link>
          </Button>
        </div>
      </header>

      <section className="hero-glow border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary px-3 py-1 text-xs font-medium text-primary">
              Built for campus placements
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Know your resume score
              <span className="text-gradient"> before recruiters do.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              PlaceUp scores your resume out of 100, tells you exactly which lines are costing you
              interviews, and then puts you through an AI mock interview until your answers hold up
              under pressure.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={primaryTo}>
                  Score my resume free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={primaryTo}>Try a mock interview</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ["100", "point score"],
                ["6", "resume sections graded"],
                ["3", "interview difficulty levels"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-bold text-primary">{value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel overflow-hidden rounded-3xl">
            <img
              src={heroImage}
              alt="Student reviewing an AI-scored resume with a placement readiness gauge"
              width={1280}
              height={960}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="grid-lines border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">Everything placement week demands</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Four tools, one login. Every score and every interview is saved to your profile so you
            can see yourself improve.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="panel">
                <CardContent className="p-5">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="panel flex flex-col items-center gap-5 rounded-3xl px-6 py-14 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-bold">
            Your first score takes two minutes.
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Create a free account, drop in your resume, and walk into your next interview knowing
            exactly where you stand.
          </p>
          <Button asChild size="lg">
            <Link to={primaryTo}>
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row">
          <Logo />
          <p>Placement assistance for students · Resume scoring &amp; AI interview practice</p>
        </div>
      </footer>
    </div>
  );
}
