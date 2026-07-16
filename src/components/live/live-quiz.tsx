import { useEffect, useMemo, useState } from "react";

type Question = {
  id: string;
  type: "mcq" | "tf" | "poll";
  prompt: string;
  choices: string[];
  correct?: number; // undefined for polls
};

const SAMPLE_QUIZZES: Record<string, Question[]> = {
  default: [
    {
      id: "q1",
      type: "mcq",
      prompt: "Which mechanism lets transformers attend to any token in the sequence?",
      choices: ["Recurrent gate", "Convolution", "Self-attention", "Pooling"],
      correct: 2,
    },
    {
      id: "q2",
      type: "tf",
      prompt: "Backpropagation requires the loss function to be differentiable.",
      choices: ["True", "False"],
      correct: 0,
    },
    {
      id: "q3",
      type: "poll",
      prompt: "Which topic should we cover in the next class?",
      choices: ["Fine-tuning", "Retrieval-Augmented Generation", "Agents", "Evaluation"],
    },
  ],
};

export function LiveQuiz({
  classId,
  onAnswer,
}: {
  classId: string;
  onAnswer: (a: { qIndex: number; choice: number; correct: boolean }) => void;
}) {
  const questions = useMemo(() => SAMPLE_QUIZZES[classId] ?? SAMPLE_QUIZZES.default, [classId]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const q = questions[index];

  // Simulated distribution for enterprise feel.
  const distribution = useMemo(() => {
    const base = q.choices.map((_, i) => (i + 1) * 7 + ((i * 13) % 9));
    const total = base.reduce((a, b) => a + b, 0);
    return base.map((n) => Math.round((n / total) * 100));
  }, [q]);

  useEffect(() => {
    setChoice(null);
    setRevealed(false);
  }, [index]);

  function submit() {
    if (choice === null) return;
    setRevealed(true);
    onAnswer({ qIndex: index, choice, correct: q.correct === choice });
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5 uppercase tracking-wider">
          {q.type === "mcq" ? "Multiple choice" : q.type === "tf" ? "True/False" : "Live poll"}
        </span>
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold">{q.prompt}</h3>
      <div className="mt-3 space-y-2">
        {q.choices.map((c, i) => {
          const isCorrect = revealed && q.correct === i;
          const isWrong = revealed && choice === i && q.correct !== i;
          return (
            <button
              key={c}
              onClick={() => !revealed && setChoice(i)}
              disabled={revealed}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm transition ${
                isCorrect
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isWrong
                    ? "border-rose-500 bg-rose-500/10"
                    : choice === i
                      ? "border-foreground bg-muted"
                      : "border-border/60 bg-background hover:bg-muted/60"
              }`}
            >
              <span>{c}</span>
              {revealed ? <span className="text-xs text-muted-foreground">{distribution[i]}%</span> : null}
            </button>
          );
        })}
      </div>
      {revealed ? (
        <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          {q.type === "poll"
            ? "Thanks for voting — results will be shared with the instructor."
            : q.correct === choice
              ? "Correct. The key idea: attention lets each token weigh every other token directly."
              : "Not quite. Review the highlighted answer and try the next question."}
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between">
        <button
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs disabled:opacity-40"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Previous
        </button>
        {revealed ? (
          <button
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={index === questions.length - 1}
          >
            Next question
          </button>
        ) : (
          <button
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40"
            onClick={submit}
            disabled={choice === null}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
