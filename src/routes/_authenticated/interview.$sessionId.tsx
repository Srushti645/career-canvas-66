import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Flag, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ScoreRing } from "@/components/ScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { interviewFeedback, interviewReply } from "@/lib/placement.functions";

type Difficulty = "easy" | "medium" | "hard";

type Feedback = {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  next_steps: string[];
};

type SessionRow = {
  id: string;
  role: string;
  difficulty: string;
  status: string;
  score: number | null;
  feedback: Feedback | null;
};

type MessageRow = {
  id: string;
  sender: "user" | "assistant";
  content: string;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/interview/$sessionId")({
  head: () => ({
    meta: [
      { title: "Mock Interview Room — PlaceUp" },
      {
        name: "description",
        content:
          "Answer live interview questions from an AI recruiter and get scored feedback at the end.",
      },
      { property: "og:title", content: "Mock Interview Room — PlaceUp" },
      {
        property: "og:description",
        content: "Live AI interview practice with scored feedback.",
      },
    ],
  }),
  component: InterviewRoom,
});

function InterviewRoom() {
  const { sessionId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const askInterviewer = useServerFn(interviewReply);
  const gradeInterview = useServerFn(interviewFeedback);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionQuery = useQuery({
    queryKey: ["interview-session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("id, role, difficulty, status, score, feedback")
        .eq("id", sessionId)
        .single();
      if (error) throw error;
      return data as unknown as SessionRow;
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["interview-messages", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_messages")
        .select("id, sender, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  const session = sessionQuery.data;
  const messages = messagesQuery.data ?? [];

  const send = useMutation({
    mutationFn: async (answer: string) => {
      await supabase.from("interview_messages").insert({
        session_id: sessionId,
        user_id: user!.id,
        sender: "user",
        content: answer,
      });
      await queryClient.invalidateQueries({ queryKey: ["interview-messages", sessionId] });

      const history = [
        ...messages.map((message) => ({ sender: message.sender, content: message.content })),
        { sender: "user" as const, content: answer },
      ];

      const reply = await askInterviewer({
        data: {
          role: session!.role,
          difficulty: session!.difficulty as Difficulty,
          history,
        },
      });

      await supabase.from("interview_messages").insert({
        session_id: sessionId,
        user_id: user!.id,
        sender: "assistant",
        content: reply.content,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["interview-messages", sessionId] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const finish = useMutation({
    mutationFn: async () => {
      const report = await gradeInterview({
        data: {
          role: session!.role,
          difficulty: session!.difficulty as Difficulty,
          history: messages.map((message) => ({
            sender: message.sender,
            content: message.content,
          })),
        },
      });
      const { error } = await supabase
        .from("interview_sessions")
        .update({ status: "completed", score: report.score, feedback: report })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["interview-sessions"] });
      toast.success("Interview evaluated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, send.isPending]);

  const submit = () => {
    const answer = draft.trim();
    if (!answer || send.isPending) return;
    setDraft("");
    send.mutate(answer);
  };

  const completed = session?.status === "completed";
  const answered = messages.filter((message) => message.sender === "user").length;

  return (
    <AppShell
      title={session ? `${session.role} interview` : "Interview room"}
      subtitle={
        session
          ? `${session.difficulty} difficulty · ${answered} answer${answered === 1 ? "" : "s"} given`
          : undefined
      }
      actions={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate({ to: "/interview" })}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            All interviews
          </Button>
          {!completed ? (
            <Button
              variant="outline"
              disabled={finish.isPending || answered < 1}
              onClick={() => finish.mutate()}
            >
              {finish.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Flag className="mr-1.5 h-4 w-4" />
              )}
              End & evaluate
            </Button>
          ) : null}
        </div>
      }
    >
      {completed && session?.feedback ? (
        <FeedbackPanel feedback={session.feedback} />
      ) : null}

      <Card className="panel">
        <CardContent className="p-0">
          <div className="max-h-[62vh] space-y-6 overflow-y-auto p-5">
            {messagesQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : null}

            {messages.map((message) =>
              message.sender === "assistant" ? (
                <div key={message.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                    N
                  </div>
                  <div className="prose prose-sm min-w-0 max-w-none text-sm leading-relaxed text-foreground/90 [&_li]:my-0.5 [&_p]:my-2 [&_strong]:text-foreground">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {message.content}
                  </div>
                </div>
              ),
            )}

            {send.isPending ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                  N
                </div>
                <span className="animate-pulse">Nova is thinking…</span>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {completed ? (
            <div className="border-t border-border p-5 text-center text-sm text-muted-foreground">
              This interview is complete. Start a fresh one to practise again.
            </div>
          ) : (
            <div className="border-t border-border p-4">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
                rows={3}
                placeholder="Type your answer — speak like you would in a real interview. Enter to send, Shift+Enter for a new line."
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Tip: use the STAR structure — Situation, Task, Action, Result.
                </span>
                <Button onClick={submit} disabled={send.isPending || !draft.trim()}>
                  {send.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  return (
    <Card className="panel mb-6">
      <CardHeader>
        <CardTitle className="text-base">Panel evaluation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 sm:flex-row">
        <ScoreRing score={feedback.score} size={132} label="Interview score" />
        <div className="min-w-0 flex-1 space-y-5">
          <p className="text-sm leading-relaxed">{feedback.verdict}</p>
          <FeedbackList title="Strengths" items={feedback.strengths} tone="bg-primary" />
          <FeedbackList
            title="Improve these"
            items={feedback.improvements}
            tone="bg-destructive"
          />
          <FeedbackList title="Practise next" items={feedback.next_steps} tone="bg-accent" />
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const dynamic = undefined;
