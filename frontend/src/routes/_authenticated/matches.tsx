import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSuggestions } from "@/services/matchApi";
import { MessageCircle, User, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/matches")({
  component: Matches,
});

function Matches() {
  const [tab, setTab] = useState<"all" | "ami" | "mentor">("all");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["matches", "suggestions"],
    queryFn: getSuggestions,
  });

  const list = students.filter((s) => 
    tab === "all" ? true : tab === "mentor" ? s.isMentor : !s.isMentor
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes connexions</h1>
        <p className="mt-1 text-muted-foreground">Vos amis et mentors actuels.</p>
      </div>

      <div className="flex gap-2 border-b">
        {(["all", "ami", "mentor"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "Tous" : t === "ami" ? "Amis" : "Mentors"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
          <UserPlus className="mb-3 h-12 w-12 text-primary" />
          <p className="text-lg font-semibold">Aucune connexion pour l'instant</p>
          <p className="mt-1 text-sm text-muted-foreground">Commencez à découvrir des étudiants</p>
          <Link to="/discover" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Découvrir
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => {
            const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
            return (
              <div key={s.id} className="rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.flag || "🌍"} {s.nationality} · {s.field}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => toast.info("Ouvrez une conversation existante depuis la page Messages.")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                    <MessageCircle className="h-4 w-4" /> Message
                  </button>
                  <Link to="/profile/$id" params={{ id: s.id }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent">
                    <User className="h-4 w-4" /> Profil
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

