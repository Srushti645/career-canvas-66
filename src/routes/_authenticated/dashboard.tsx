import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, MessagesSquare, Target, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ScoreRing } from "@/components/ScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Suggestion = { title: string; detail: string; impact: "high" | "medium" | "low" };

type AnalysisRow = {
  id: string;
  created_at: string;
  target_role: string;
  overall_score: number;
  suggestions: Suggestion[];
};

type SessionRow = {
  id: string;
  role: string;
  status: string;
  score: number | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Placement Dashboard — PlaceUp" },
      {
        name: "description",
        content:
          "Track your resume score, top fixes and mock interview results in one placement readiness dashboard.",
      },
      { property: "og:title", content: "Your Placement Dashboard — PlaceUp" },
      {
        property: "og:description",
        content: "Resume score, interview results and next actions in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const analysesQuery = useQuery({
    queryKey: ["resume-analyses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("id, created_at, target_role, overall_score, suggestions")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as AnalysisRow[];
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["interview-sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("id, role, status, score, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });

  const analyses = analysesQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const latest = analyses[0];
  const previous = analyses[1];
  const delta = latest && previous ? latest.overall_score - previous.overall_score : null;
  const graded = sessions.filter((session) => typeof session.score === "number");
  const interviewAverage = graded.length
    ? Math.round(graded.reduce((sum, item) => sum + (item.score ?? 0), 0) / graded.length)
    : null;
  const readiness =
    latest && interviewAverage !== null
      ? Math.round(latest.overall_score * 0.5 + interviewAverage * 0.5)
      : (latest?.overall_score ?? interviewAverage);

  return (
    <AppShell
      title={`Hi${user?.user_metadata?.["full_name"] ? `, ${String(user.user_metadata["full_name"]).split(" ")[0]}` : ""} 👋`}
      subtitle="Here's where your placement readiness stands today."
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/resume">
              <FileText className="mr-1.5 h-4 w-4" />
              Analyse resume
            </Link>
          </Button>
          <Button asChild>
            <Link to="/interview">
              <MessagesSquare className="mr-1.5 h-4 w-4" />
              Mock interview
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="panel md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Placement readiness</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ScoreRing score={readiness ?? 0} label="Readiness" />
            {delta !== null ? (
              <Badge variant="outline" className="border-primary/40 text-primary">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                {delta >= 0 ? "+" : ""}
                {delta} vs last resume
              </Badge>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Analyse a resume and finish one mock interview for a full score.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
          <StatCard
            icon={<FileText className="h-4 w-4 text-primary" />}
            label="Latest resume score"
            value={latest ? `${latest.overall_score}/100` : "—"}
            hint={latest ? latest.target_role : "No resume analysed yet"}
          />
          <StatCard
            icon={<MessagesSquare className="h-4 w-4 text-accent" />}
            label="Interview average"
            value={interviewAverage !== null ? `${interviewAverage}/100` : "—"}
            hint={`${sessions.length} session${sessions.length === 1 ? "" : "s"} started`}
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-primary" />}
            label="Resumes analysed"
            value={String(analyses.length)}
            hint="Re-run after every edit to track gains"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-accent" />}
            label="Interviews completed"
            value={String(graded.length)}
            hint="Aim for 5+ before placement week"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-base">Do these next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latest?.suggestions?.length ? (
              latest.suggestions.slice(0, 4).map((suggestion, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-secondary/40 p-3.5"
                >
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{suggestion.detail}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Your personalised action list appears after your first resume analysis.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/resume">
                    Analyse my resume
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-base">Recent mock interviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No interviews yet — the first one is the hardest, so get it out of the way.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/interview">
                    Start a mock interview
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              sessions.map((session) => (
                <Link
                  key={session.id}
                  to="/interview/$sessionId"
                  params={{ sessionId: session.id }}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-secondary/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{session.role}</span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  {session.status === "completed" ? (
                    <Badge variant="secondary">{session.score ?? "—"}/100</Badge>
                  ) : (
                    <Badge variant="outline" className="border-accent/40 text-accent">
                      resume
                    </Badge>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="panel">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-3 font-display text-3xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
