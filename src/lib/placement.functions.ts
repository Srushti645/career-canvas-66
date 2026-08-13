import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  runInterviewFeedback,
  runInterviewTurn,
  runResumeAnalysis,
} from "@/lib/ai.server";

const analyzeInput = z.object({
  resumeText: z.string().min(80, "Add a bit more resume content before analysing."),
  targetRole: z.string().min(2).max(120),
});

const turnSchema = z.object({
  sender: z.enum(["user", "assistant"]),
  content: z.string(),
});

const interviewInput = z.object({
  role: z.string().min(2).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]),
  history: z.array(turnSchema).max(60),
  resumeContext: z.string().optional(),
});

const feedbackInput = z.object({
  role: z.string().min(2).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]),
  history: z.array(turnSchema).min(2).max(60),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => analyzeInput.parse(input))
  .handler(async ({ data }) => runResumeAnalysis(data.resumeText, data.targetRole));

export const interviewReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => interviewInput.parse(input))
  .handler(async ({ data }) => ({ content: await runInterviewTurn(data) }));

export const interviewFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => feedbackInput.parse(input))
  .handler(async ({ data }) => runInterviewFeedback(data));
