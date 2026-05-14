import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { getUser } from "@/lib/auth";
import { getMe } from "@/services/usersApi";
import { getSuggestions } from "@/services/matchApi";
import { getConversations } from "@/services/messagesApi";
import { getActivityRecommendations, formatActivityDate, getActivityCategory } from "@/services/activitiesApi";
import { getMentorRequests, updateMentorRequestStatus } from "@/services/mentorsApi";
import { Heart, MessageCircle, Calendar, TrendingUp, MapPin, Users, Loader2, Check, X } from "lucide-react";
import { StudentCard } from "@/components/StudentCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const cachedUser = getUser();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMe,
    initialData: {
      id: cachedUser.id || "",
      name: cachedUser.name,
      email: cachedUser.email,
      country: cachedUser.country || cachedUser.nationality,
      language: cachedUser.language,
      major: cachedUser.major || cachedUser.field,
      interests: cachedUser.interests,
      bio: cachedUser.bio,
      role: (cachedUser as any).role || "student"
    }
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["matches", "suggestions"],
    queryFn: getSuggestions,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: getConversations,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities", "recommendations"],
    queryFn: getActivityRecommendations,
  });

  const { data: mentorRequests = [], isLoading: mentorRequestsLoading } = useQuery({
    queryKey: ["mentors", "requests"],
    queryFn: getMentorRequests,
    enabled: !!user && user.role === "mentor"
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: "accepted" | "rejected" }) => updateMentorRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors", "requests"] });
      toast.success("Demande mise à jour");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erreur"),
  });

  const loading = userLoading || suggestionsLoading || conversationsLoading || activitiesLoading;

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const fields = [user.name, user.country, user.language, user.major, user.bio, user.interests?.length ? "interests" : ""];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  const stats = [
    { label: "Nouveaux matches", value: suggestions.length, icon: Heart, color: "text-primary", bg: "bg-primary/10" },
    { label: "Conversations", value: conversations.length, icon: MessageCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Activités recommandées", value: activities.length, icon: Calendar, color: "text-accent", bg: "bg-accent/10" },
    { label: "Profil complété", value: `${profileCompletion}%`, icon: TrendingUp, color: "text-primary-soft", bg: "bg-primary-soft/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bonjour {user?.name} 👋</h1>
        <p className="mt-1 text-muted-foreground">{loading ? "Chargement de votre activité..." : "Voici votre activité du jour."}</p>
      </div>

      {profileCompletion < 100 && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-primary-soft p-6 text-primary-foreground shadow-lg">
          <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <h2 className="text-lg font-bold">Boostez votre visibilité ! 🚀</h2>
              <p className="mt-1 text-sm opacity-90">
                Un profil complété à 100% reçoit 3x plus de matches et de recommandations d'IA.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${profileCompletion}%` }} />
                </div>
                <span className="text-sm font-bold">{profileCompletion}%</span>
              </div>
            </div>
            <Link 
              to="/profile/edit" 
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-soft transition hover:scale-105 active:scale-95"
            >
              Compléter mon profil
            </Link>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-4 left-1/2 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="mt-3 text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {user?.role === "mentor" && mentorRequests.filter(r => r.status === "pending").length > 0 && (
        <section className="rounded-2xl border-2 border-warning/30 bg-warning/5 p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-warning-foreground">Demandes de mentorat en attente</h2>
            <span className="rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-warning-foreground">
              {mentorRequests.filter(r => r.status === "pending").length} nouvelle(s)
            </span>
          </div>
          <div className="space-y-4">
            {mentorRequests.filter(r => r.status === "pending").map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {req.studentName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{req.studentName}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{req.message}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateRequestMutation.mutate({ id: req.id, status: "accepted" })}
                    disabled={updateRequestMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => updateRequestMutation.mutate({ id: req.id, status: "rejected" })}
                    disabled={updateRequestMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-accent"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Suggestions du jour</h2>
          <Link to="/discover" className="text-sm font-medium text-primary hover:underline">Tout voir</Link>
        </div>
        {suggestionsLoading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border bg-card shadow-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyCard text="Aucune suggestion disponible pour le moment." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.slice(0, 3).map((s) => <StudentCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Messages récents</h2>
            <Link to="/messages" className="text-sm font-medium text-primary hover:underline">Tout voir</Link>
          </div>
          <div className="space-y-2 rounded-2xl border bg-card p-2 shadow-card">
            {conversationsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucune conversation récente.</p>
            ) : conversations.slice(0, 3).map((c) => {
              const participant = Object.values(c.participantsInfo || {})[0];
              return (
                <Link
                  key={c.id}
                  to="/messages/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {(participant?.name || "M").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{participant?.name || "Conversation"}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.lastMessage || "Aucun message pour le moment"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Activités recommandées</h2>
            <Link to="/events" className="text-sm font-medium text-primary hover:underline">Tout voir</Link>
          </div>
          {activitiesLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border bg-card shadow-card">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <EmptyCard text="Aucune activité recommandée pour le moment." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activities.slice(0, 2).map((activity) => (
                <div key={activity.id} className="rounded-2xl border bg-card p-5 shadow-card">
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                    {getActivityCategory(activity)}
                  </span>
                  <h3 className="mt-3 font-semibold">{activity.title}</h3>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatActivityDate(activity.startDate)}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{activity.location || "Lieu à confirmer"}</div>
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{activity.currentParticipants || 0} participants</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}



function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-card">
      {text}
    </div>
  );
}
