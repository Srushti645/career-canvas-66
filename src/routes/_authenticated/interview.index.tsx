import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessagesSquare, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { interviewReply } from "@/lib/placement.functions";

type Difficulty = "easy" | "medium" | "hard";

type SessionRow = {
  id: string;
  role: string;
  difficulty: string;
  status: string;
  score: number | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/interview/")({
  head: () => ({
    meta: [
      { title: "AI Mock Interviews — PlaceUp" },
      {
        name: "description",
        content:
          "Practise placement interviews with an AI recruiter that asks role-specific questions and scores your answers.",
      },
      { property: "og:title", content: "AI Mock Interviews — PlaceUp" },
      {
        property: "og:description",
        content: "Role-specific mock interviews with instant, honest feedback.",
      },
    ],
  }),
  component: InterviewSetupPage,
});

function InterviewSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const askInterviewer = useServerFn(interviewReply);
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [useResume, setUseResume] = useState(true);

  const sessionsQuery = useQuery({
    queryKey: ["interview-sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("id, role, difficulty, status, score, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });

  const start = useMutation({
    mutationFn: async () => {
      let resumeContext: string | undefined;
      if (useResume) {
        const { data: resume } = await supabase
          .from("resume_analyses")
          .select("resume_text")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (resume?.resume_text) resumeContext = resume.resume_text;
      }

      const { data: session, error } = await supabase
        .from("interview_sessions")
        .insert({ user_id: user!.id, role, difficulty, status: "active" })
        .select("id")
        .single();
      if (error) throw error;

      const opening = await askInterviewer({
        data: {
          role,
          difficulty,
          history: [],
          ...(resumeContext ? { resumeContext } : {}),
        },
      });

      await supabase.from("interview_messages").insert({
        session_id: session.id,
        user_id: user!.id,
        sender: "assistant",
        content: opening.content,
      });

      return session.id as string;
    },
    onSuccess: (sessionId) => navigate({ to: "/interview/$sessionId", params: { sessionId } }),
    onError: (error: Error) => toast.error(error.message),
  });

  const sessions = sessionsQuery.data ?? [];

  return (
    <AppShell
      title="Mock interview"
      subtitle="Sit in front of Nova, an AI recruiter that interviews you like a real placement panel."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="panel h-fit">
          <CardHeader>
            <CardTitle className="text-base">Set up your interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="interview-role">Role you're interviewing for</Label>
              <Input
                id="interview-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Data Analyst, SDE Intern"
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy — first interview warm-up</SelectItem>
                  <SelectItem value="medium">Medium — typical campus round</SelectItem>
                  <SelectItem value="hard">Hard — product company grilling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              <input
                type="checkbox"
                className="mt-1 accent-primary"
                checked={useResume}
                onChange={(event) => setUseResume(event.target.checked)}
              />
              <span className="text-sm">
                Ask questions from my latest resume
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Nova will dig into your projects and skills the way a real interviewer does.
                </span>
              </span>
            </label>

            <Button
              size="lg"
              className="w-full"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {start.isPending ? "Setting up the room…" : "Start mock interview"}
            </Button>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-base">Your interview history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessionsQuery.isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <MessagesSquare className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No interviews yet. Your first one takes about 10 minutes.
                </p>
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
                      {session.difficulty} · {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  {session.status === "completed" ? (
                    <Badge variant="secondary">{session.score ?? "—"}/100</Badge>
                  ) : (
                    <Badge variant="outline" className="border-accent/40 text-accent">
                      in progress
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
