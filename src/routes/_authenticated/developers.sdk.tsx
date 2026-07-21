import { createFileRoute } from "@tanstack/react-router";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/developers/sdk")({
  component: SdkPage,
});

const SDKS = [
  { name: "JavaScript", version: "2.1.0", pkg: "npm i @glintr/sdk", lang: "js", color: "bg-yellow-500" },
  { name: "TypeScript", version: "2.1.0", pkg: "npm i @glintr/sdk", lang: "ts", color: "bg-blue-600" },
  { name: "Python", version: "1.9.2", pkg: "pip install glintr", lang: "py", color: "bg-blue-500" },
  { name: "PHP", version: "1.4.0", pkg: "composer require glintr/sdk", lang: "php", color: "bg-indigo-600" },
  { name: "Go", version: "1.3.1", pkg: "go get github.com/glintr/go", lang: "go", color: "bg-cyan-500" },
  { name: "Java", version: "1.2.0", pkg: "com.glintr:sdk:1.2.0", lang: "java", color: "bg-orange-600" },
  { name: "C#", version: "1.1.0", pkg: "dotnet add package Glintr", lang: "cs", color: "bg-purple-600" },
  { name: "Ruby", version: "1.0.5", pkg: "gem install glintr", lang: "rb", color: "bg-red-600" },
  { name: "Rust", version: "0.9.0", pkg: "cargo add glintr", lang: "rs", color: "bg-orange-700" },
  { name: "Swift", version: "0.8.0", pkg: "SwiftPM: glintr-swift", lang: "swift", color: "bg-orange-500" },
  { name: "Kotlin", version: "0.8.0", pkg: "implementation('io.glintr:sdk')", lang: "kt", color: "bg-purple-500" },
];

function SdkPage() {
  return (
    <DeveloperShell>
      <div>
        <h2 className="text-2xl font-semibold">Official SDKs</h2>
        <p className="text-sm text-muted-foreground">Type-safe clients auto-generated from OpenAPI, published to each language's package registry.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SDKS.map((sdk) => (
          <Card key={sdk.name} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-lg text-white font-bold ${sdk.color}`}>{sdk.lang.toUpperCase()}</div>
                <div>
                  <div className="font-semibold">{sdk.name}</div>
                  <Badge variant="secondary" className="mt-0.5 font-mono text-[10px]">v{sdk.version}</Badge>
                </div>
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">{sdk.pkg}</pre>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1"><Download className="mr-2 h-3.5 w-3.5" />Install</Button>
              <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <h3 className="font-semibold">CLI</h3>
        <p className="mt-1 text-sm text-muted-foreground">One command per capability. Deploy from your terminal.</p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100">
{`# Install
npm i -g @glintr/cli

# Available commands
glintr login
glintr init
glintr deploy
glintr generate
glintr projects list
glintr templates list
glintr knowledge sync
glintr publish`}
        </pre>
      </Card>
    </DeveloperShell>
  );
}
