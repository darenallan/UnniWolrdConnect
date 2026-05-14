import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { languages, fields } from "@/lib/constants";
import { getMentors } from "@/services/matchApi";
import { sendMentorRequest } from "@/services/mentorsApi";
import { GraduationCap, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mentors")({
  component: Mentors,
});

function Mentors() {
  const [field, setField] = useState("");
  const [lang, setLang] = useState("");

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["mentors"],
    queryFn: getMentors,
  });

  const mutation = useMutation({
    mutationFn: (mentorId: string) => sendMentorRequest(mentorId),
    onSuccess: () => toast.success("Demande envoyée au mentor !"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi"),
  });

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      if (field && m.field !== field) return false;
      if (lang && !m.languages.includes(lang)) return false;
      return true;
    });
  }, [field, lang, mentors]);

  const sel = "rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trouver un mentor</h1>
        <p className="mt-1 text-muted-foreground">Des étudiants expérimentés prêts à vous accompagner.</p>
      </div>

      <div className="rounded-2xl border-2 border-primary/30 bg-primary-soft p-5">
        <p className="text-xs font-semibold uppercase text-primary">Mentorat</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les mentors affichés viennent de la base de données réelle avec le rôle mentor.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border bg-card p-4 shadow-card">
        <select value={field} onChange={(e) => setField(e.target.value)} className={sel}>
          <option value="">Toutes filières</option>
          {fields.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className={sel}>
          <option value="">Toutes langues</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
          <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">Aucun mentor trouvé</p>
          <p className="text-sm text-muted-foreground">Essayez d'élargir vos filtres ou créez des profils avec le rôle mentor.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((m) => {
            const initials = m.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
            return (
              <div key={m.id} className="rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-lg font-bold text-warning">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{m.name}</h3>
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">Mentor</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.flag ? `${m.flag} ` : ""}{m.nationality}</p>
                    <p className="mt-1 text-sm font-medium">{m.field}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{m.bio}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {m.languages.map((l) => (
                    <span key={l} className="rounded bg-muted px-2 py-0.5 text-muted-foreground">{l}</span>
                  ))}
                </div>
                <button
                  onClick={() => mutation.mutate(m.id)}
                  disabled={mutation.isPending}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {mutation.isPending && mutation.variables === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : "Demander comme mentor"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


