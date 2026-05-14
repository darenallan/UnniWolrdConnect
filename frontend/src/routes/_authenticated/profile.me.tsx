import { createFileRoute, Link } from "@tanstack/react-router";
import { getUser } from "@/lib/auth";
import { getMe, getStats, type UserProfile } from "@/services/usersApi";
import { Pencil, GraduationCap, Users, Calendar, Heart, MapPin, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/profile/me")({
  component: MyProfile,
});

const BASE_URL = API_URL.replace("/api", "");

function MyProfile() {
  const { data: u, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMe,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["profile", "stats"],
    queryFn: getStats,
  });

  if (loadingProfile || !u) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = u.avatar ? (u.avatar.startsWith("http") ? u.avatar : `${BASE_URL}${u.avatar}`) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header Profil */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="px-6 pb-6">
          <div className="relative -mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-24 w-24 rounded-2xl border-4 border-card object-cover shadow-lg" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card bg-primary-soft text-3xl font-bold text-primary shadow-lg">
                  {initials}
                </div>
              )}
              <Link 
                to="/profile/edit" 
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{u.name}</h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {u.country || "France"}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {u.major || "Étudiant"}</span>
              </div>
            </div>
            <Link 
              to="/profile/edit" 
              className="w-full sm:w-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
            >
              Modifier le profil
            </Link>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          icon={<Heart className="h-4 w-4 text-rose-500" />} 
          label="Matches" 
          value={stats?.matches ?? 0} 
          loading={loadingStats} 
        />
        <StatCard 
          icon={<Users className="h-4 w-4 text-blue-500" />} 
          label="Groupes" 
          value={stats?.groups ?? 0} 
          loading={loadingStats} 
        />
        <StatCard 
          icon={<Calendar className="h-4 w-4 text-amber-500" />} 
          label="Événements" 
          value={stats?.events ?? 0} 
          loading={loadingStats} 
        />
      </div>

      {/* Détails */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-4 w-4 text-primary" /> Biographie
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {u.bio || "Aucune biographie n'a été ajoutée pour le moment. Présentez-vous à la communauté !"}
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-semibold">Langues parlées</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {u.language ? (
                <span className="flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5 text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {u.language}
                </span>
              ) : (
                <p className="text-sm text-muted-foreground italic">Non renseigné</p>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Centres d'intérêt</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {u.interests && u.interests.length > 0 ? (
              u.interests.map((i) => (
                <span key={i} className="rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  {i}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucun intérêt renseigné</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: number; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-4 shadow-sm text-center">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
        {icon}
      </div>
      {loading ? (
        <div className="h-6 w-8 animate-pulse rounded bg-muted" />
      ) : (
        <span className="text-xl font-bold">{value}</span>
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
