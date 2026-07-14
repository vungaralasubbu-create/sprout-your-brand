import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Send,
  SkipForward,
  StopCircle,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  MessageSquareText,
} from "lucide-react";
import {
  finaliseInterviewSession,
  getInterviewSession,
  skipInterviewQuestion,
  submitInterviewAnswer,
} from "@/lib/student/interview.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/career/interview/$id")({
  head: () => ({ meta: [{ title: "Mock Interview — Glintr LMS" }] }),
  component: InterviewPlayer,
});

function InterviewPlayer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getInterviewSession);
  const submitFn = useServerFn(submitInterviewAnswer);
  const skipFn = useServerFn(skipInterviewQuestion);
  const endFn = useServerFn(finaliseInterviewSession);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["interview-session", id],
    queryFn: () => getFn({ data: { id } }),
    refetchOnWindowFocus: false,
  });

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const session = data?.session as any;
  const questions = (data?.questions ?? []) as any[];
  const isCompleted = session?.status === "completed" || session?.status === "incomplete";

  useEffect(() => {
    if (!data) return;
    if (isCompleted) {
      navigate({
        to: "/student/career/interview/$id/report",
        params: { id },
        replace: true,
      });
      return;
    }
    // Position on first unanswered
    setIndex(Math.min(data.nextIndex, questions.length - 1));
  }, [data, isCompleted]);

  const current = questions[index];
  useEffect(() => {
    if (current?.answer?.answer_text) setAnswer(current.answer.answer_text);
    else if (current?.answer?.transcript) setAnswer(current.answer.transcript);
    else setAnswer("");
  }, [current?.id]);

  const submitMutation = useMutation({
    mutationFn: async (isTranscript: boolean) => {
      if (!current) return;
      const trimmed = answer.trim();
      if (!trimmed) {
        toast.error("Please write your answer");
        throw new Error("empty");
      }
      await submitFn({
        data: {
          session_id: id,
          question_id: current.id,
          answer_text: isTranscript ? undefined : trimmed,
          transcript: isTranscript ? trimmed : undefined,
        },
      });
    },
    onSuccess: async () => {
      await refetch();
      if (index >= questions.length - 1) {
        // Finalise
        await endFn({ data: { session_id: id } });
        qc.invalidateQueries({ queryKey: ["interview-overview"] });
        navigate({
          to: "/student/career/interview/$id/report",
          params: { id },
          replace: true,
        });
      } else {
        setIndex((i) => i + 1);
        setAnswer("");
      }
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      if (!current) return;
      await skipFn({ data: { session_id: id, question_id: current.id } });
    },
    onSuccess: async () => {
      await refetch();
      if (index >= questions.length - 1) {
        await endFn({ data: { session_id: id } });
        qc.invalidateQueries({ queryKey: ["interview-overview"] });
        navigate({
          to: "/student/career/interview/$id/report",
          params: { id },
          replace: true,
        });
      } else {
        setIndex((i) => i + 1);
        setAnswer("");
      }
    },
  });

  const endMutation = useMutation({
    mutationFn: () => endFn({ data: { session_id: id, end_early: true } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interview-overview"] });
      navigate({
        to: "/student/career/interview/$id/report",
        params: { id },
        replace: true,
      });
    },
  });

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((index + 1) / questions.length) * 100);
  }, [index, questions.length]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      toast.info("Recording. Speak your answer, then stop.");
    } catch (e) {
      toast.error("Microphone permission denied. Use text mode instead.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    toast.message(
      "Transcription unavailable in this build. Type your spoken answer below to submit.",
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/student/career/interview">
            <ArrowLeft className="size-4 mr-1" /> Exit
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("End this interview? Your progress will be saved.")) {
              endMutation.mutate();
            }
          }}
          disabled={endMutation.isPending}
        >
          <StopCircle className="size-4 mr-1" /> End Interview
        </Button>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {String(session.interview_type)}
          </Badge>
          <Badge variant="muted" className="capitalize">
            {session.difficulty}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {session.mode}
          </Badge>
          {session.target_role ? (
            <Badge variant="outline">{session.target_role}</Badge>
          ) : null}
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {current ? (
        <section className="rounded-2xl border bg-white p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {current.category ?? "Interview Question"}
          </div>
          <h2 className="text-lg md:text-xl font-display font-semibold leading-snug">
            {current.question_text}
          </h2>
          {current.context_hint ? (
            <p className="text-sm text-muted-foreground">{current.context_hint}</p>
          ) : null}
        </section>
      ) : (
        <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground">
          No questions were generated for this session. You can end and start a new one.
        </div>
      )}

      {current && (
        <section className="rounded-2xl border bg-white p-5 md:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <MessageSquareText className="size-3.5" /> Your Answer
            </div>
            {session.mode === "voice" && (
              <Button
                type="button"
                size="sm"
                variant={recording ? "danger" : "outline"}
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? (
                  <>
                    <MicOff className="size-4 mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="size-4 mr-1" /> Record
                  </>
                )}
              </Button>
            )}
          </div>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer. Structure your response clearly — situation, action, result."
            rows={8}
            maxLength={15000}
            className="resize-none"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{answer.length} / 15000</span>
            <span>One question at a time. You cannot go back.</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              size="lg"
              className="flex-1"
              disabled={submitMutation.isPending || !answer.trim()}
              onClick={() => submitMutation.mutate(session.mode === "voice")}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="size-4 mr-1.5" />{" "}
                  {index >= questions.length - 1 ? "Submit & Finish" : "Submit Answer"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={skipMutation.isPending}
              onClick={() => skipMutation.mutate()}
            >
              <SkipForward className="size-4 mr-1.5" /> Skip
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
