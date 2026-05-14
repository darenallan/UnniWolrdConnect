import { createFileRoute } from "@tanstack/react-router";
import { getUser } from "@/lib/auth";
import { getUserById, type UserProfile } from "@/services/usersApi";
import { MessageCircle, UserPlus, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/profile/$id")({
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = Route.useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const me = getUser();

  useEffect(() => {
    getUserById(id)
      .then(setProfile)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Impossible de charger le profil"))
      .finally(() => setLoading(false));
  }, [id]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 text-center shadow-card">
        {loading ? "Chargement du profil..." : "Profil introuvable."}
      </div>
    );
  }

  const sharedInterests = (me.interests || []).filter((i) => (profile.interests || []).includes(i));
  const sharedLangs = [me.language].filter((l): l is string => !!l && l === profile.language);
  const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-3xl font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {profile.role === "mentor" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                  <GraduationCap className="h-3.5 w-3.5" /> Mentor
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profile.country || "—"}</p>
            <p className="mt-1 text-sm font-medium">{profile.major || "Étudiant"}</p>
          </div>
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-primary bg-card text-primary">
            <span className="text-2xl font-bold">{sharedInterests.length + sharedLangs.length}</span>
            <span className="text-[10px] uppercase tracking-wide">Match</span>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h2 className="text-sm font-semibold text-muted-foreground">Biographie</h2>
          <p className="mt-2 text-sm">{profile.bio || "Aucune biographie renseignée."}</p>
        </div>

        <div className="mt-6 rounded-xl bg-primary-soft p-4">
          <h2 className="text-sm font-semibold text-primary">Points communs avec vous</h2>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Intérêts partagés</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {sharedInterests.length > 0 ? sharedInterests.map((i) => (
                  <span key={i} className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">{i}</span>
                )) : <span className="text-xs text-muted-foreground">Aucun en commun</span>}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Langues partagées</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {sharedLangs.length > 0 ? sharedLangs.map((l) => (
                  <span key={l} className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">{l}</span>
                )) : <span className="text-xs text-muted-foreground">Aucune en commun</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => toast.info("Ouvrez une conversation existante depuis la page Messages.")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            <MessageCircle className="h-4 w-4" /> Envoyer un message
          </button>
          <button onClick={() => toast.info("La demande d'ami sera connectée dans la migration friends/connections.")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary-soft">
            <UserPlus className="h-4 w-4" /> Ajouter en ami
          </button>
          {profile.role === "mentor" && (
            <button onClick={() => toast.info("La demande de mentorat sera connectée dans la migration mentors.")} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-warning px-4 py-2.5 text-sm font-medium text-warning-foreground hover:opacity-90">
              <GraduationCap className="h-4 w-4" /> Demander comme mentor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
