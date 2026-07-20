import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StubPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
        <Sparkles className="h-3 w-3" />
        {eyebrow}
      </div>
      <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/cloud/signup">
          <Button size="lg" className="bg-gradient-to-r from-cyan-500 via-sky-500 to-lime-500 text-white">
            Start Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link to="/cloud/contact">
          <Button size="lg" variant="outline">
            Book demo
          </Button>
        </Link>
      </div>
    </div>
  );
}
