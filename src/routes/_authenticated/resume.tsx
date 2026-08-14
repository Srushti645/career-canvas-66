import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Sparkle, TrendingUp } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ScoreRing } from "@/components/ScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { analyzeResume } from "@/lib/placement.functions";
import { extractResumeText } from "@/lib/resume-file";
import { supabase } from "@/integrations/supabase/client";

type Suggestion = { title: string; detail: string; impact: "high" | "medium" | "low" };

type AnalysisRow = {
  id: string;
  created_at: string;
  file_name: string | null;
  target_role: string;
  overall_score: number;
  summary: string | null;
  section_scores: Record<string, number>;
  strengths: string[];
  gaps: string[];
  suggestions: Suggestion[];
  missing_keywords: string[];
};

const SECTION_LABELS: Record<string, string> = {
  impact: "Impact & metrics",
  skills_match: "Skills match",
  structure: "Structure",
  clarity: "Clarity",
  ats_readiness: "ATS readiness",
  projects: "Projects",
};

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume Analyser & Score — PlaceUp" },
      {
        name: "description",
        content:
          "Upload your resume, get an instant placement score, section-wise breakdown and concrete tips to raise your resume weightage.",
      },
      { property: "og:title", content: "Resume Analyser & Score — PlaceUp" },
      {
        property: "og:description",
        content: "Instant resume score with section breakdown and fixes for campus placements.",
      },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const runAnalysis = useServerFn(analyzeResume);
  const fileRef = useRef<HTMLInputElement>(null);

  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [reading, setReading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["resume-analyses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as AnalysisRow[];
    },
  });

  const history = historyQuery.data ?? [];
  const active = history.find((item) => item.id === activeId) ?? history[0] ?? null;

  const analyse = useMutation({
    mutationFn: async () => {
      const report = await runAnalysis({ data: { resumeText, targetRole } });
      const { data, error } = await supabase
        .from("resume_analyses")
        .insert({
          user_id: user!.id,
          file_name: fileName,
          target_role: targetRole,
          resume_text: resumeText,
          overall_score: report.overall_score,
          section_scores: report.section_scores,
          strengths: report.strengths,
          gaps: report.gaps,
          suggestions: report.suggestions,
          missing_keywords: report.missing_keywords,
          summary: report.summary,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as AnalysisRow;
    },
    onSuccess: (row) => {
      setActiveId(row.id);
      queryClient.invalidateQueries({ queryKey: ["resume-analyses"] });
      toast.success(`Resume scored ${row.overall_score}/100`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    try {
      const text = await extractResumeText(file);
      if (text.length < 80) {
        throw new Error("We couldn't read enough text from that file. Try pasting it instead.");
      }
      setResumeText(text);
      setFileName(file.name);
      toast.success(`Loaded ${file.name}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setReading(false);
    }
  };

  return (
    <AppShell
      title="Resume analyser"
      subtitle="Score your resume against a target role and get fixes that raise its weightage."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.35fr]">
        <Card className="panel h-fit">
          <CardHeader>
            <CardTitle className="text-base">1. Add your resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="role">Target role</Label>
              <Input
                id="role"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="e.g. Data Analyst, SDE Intern"
              />
            </div>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleFile(event.dataTransfer.files[0]);
              }}
              className="rounded-xl border border-dashed border-input bg-secondary/40 p-6 text-center"
            >
              <FileUp className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-3 text-sm font-medium">Drop your resume PDF here</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF or .txt · Word users can paste the text below
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain"
                className="hidden"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={reading}
                onClick={() => fileRef.current?.click()}
              >
                {reading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Choose file
              </Button>
              {fileName ? (
                <p className="mt-3 truncate text-xs text-primary">{fileName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume text</Label>
              <Textarea
                id="resume-text"
                value={resumeText}
                onChange={(event) => {
                  setResumeText(event.target.value);
                  setFileName(null);
                }}
                rows={10}
                placeholder="Paste your resume content here — education, skills, projects, internships, achievements..."
              />
              <p className="text-xs text-muted-foreground">{resumeText.length} characters</p>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={analyse.isPending || resumeText.trim().length < 80}
              onClick={() => analyse.mutate()}
            >
              {analyse.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkle className="mr-2 h-4 w-4" />
              )}
              {analyse.isPending ? "Analysing your resume…" : "Analyse & score"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {active ? (
            <AnalysisReport report={active} />
          ) : (
            <Card className="panel">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <TrendingUp className="h-7 w-7 text-muted-foreground" />
                <p className="font-display text-lg font-semibold">No analysis yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add your resume on the left and we'll score it out of 100, break it down section
                  by section and tell you exactly what to fix first.
                </p>
              </CardContent>
            </Card>
          )}

          {history.length > 1 ? (
            <Card className="panel">
              <CardHeader>
                <CardTitle className="text-base">Past analyses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      item.id === active?.id
                        ? "border-primary/40 bg-secondary"
                        : "border-border hover:bg-secondary/60"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.target_role}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.file_name ?? "Pasted resume"} ·{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <Badge variant="secondary">{item.overall_score}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function AnalysisReport({ report }: { report: AnalysisRow }) {
  const impactTone: Record<Suggestion["impact"], string> = {
    high: "border-primary/40 text-primary",
    medium: "border-accent/40 text-accent",
    low: "border-border text-muted-foreground",
  };

  const sectionScores = report.section_scores ?? {};
  const suggestions = report.suggestions ?? [];
  const strengths = report.strengths ?? [];
  const gaps = report.gaps ?? [];
  const missingKeywords = report.missing_keywords ?? [];


  return (
    <div className="space-y-6">
      <Card className="panel">
        <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:items-center sm:gap-10">
          <ScoreRing score={report.overall_score} />
          <div className="min-w-0 flex-1">
            <Badge variant="secondary" className="mb-3">
              {report.target_role}
            </Badge>
            <p className="text-sm leading-relaxed text-foreground/90">{report.summary}</p>
            <div className="mt-5 space-y-3">
              {Object.entries(report.section_scores).map(([key, value]) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{SECTION_LABELS[key] ?? key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <Progress value={value} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="panel">
        <CardHeader>
          <CardTitle className="text-base">Raise your resume weightage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.suggestions.map((suggestion, index) => (
            <div key={index} className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{suggestion.title}</p>
                <Badge variant="outline" className={impactTone[suggestion.impact]}>
                  {suggestion.impact} impact
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{suggestion.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-base text-primary">What's working</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {report.strengths.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-base text-destructive">What's costing you</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {report.gaps.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {report.missing_keywords.length ? (
        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-base">Keywords recruiters look for</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.missing_keywords.map((keyword) => (
              <Badge key={keyword} variant="outline" className="border-accent/40 text-accent">
                {keyword}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
