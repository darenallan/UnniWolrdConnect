import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { languages, fields, countries } from "@/lib/constants";
import { StudentCard } from "@/components/StudentCard";
import { Search, Loader2, Sparkles } from "lucide-react";
import { getAISuggestions } from "@/services/matchApi";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/discover")({
  component: Discover,
});

function Discover() {
  const [lang, setLang] = useState("");
  const [field, setField] = useState("");
  const [nat, setNat] = useState("");
  const [type, setType] = useState<"all" | "ami" | "mentor">("all");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["discover", "suggestions", "ai"],
    queryFn: getAISuggestions,
  });

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (lang && !s.languages.includes(lang)) return false;
      if (field && s.field !== field) return false;
      if (nat && s.nationality !== nat) return false;
      if (type === "mentor" && !s.isMentor) return false;
      if (type === "ami" && s.isMentor) return false;
      return true;
    });
  }, [lang, field, nat, type, students]);

  const sel = "rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Découvrir des étudiants</h1>
        <p className="mt-1 text-muted-foreground">Trouvez des amis qui partagent vos passions et votre culture.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className={sel}>
          <option value="">Toutes langues</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={field} onChange={(e) => setField(e.target.value)} className={sel}>
          <option value="">Toutes filières</option>
          {fields.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select value={nat} onChange={(e) => setNat(e.target.value)} className={sel}>
          <option value="">Toutes nationalités</option>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="ml-auto flex rounded-lg border bg-background p-1">
          {(["all", "ami", "mentor"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "Tous" : t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">Aucun étudiant trouvé</p>
          <p className="text-sm text-muted-foreground">Essayez d'élargir vos filtres.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => <StudentCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}

