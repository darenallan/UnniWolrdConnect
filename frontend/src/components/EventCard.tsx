import { useState } from "react";
import { MapPin, Calendar, Users, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { formatActivityDate, getActivityCategory, joinActivity, leaveActivity, type Activity } from "@/services/activitiesApi";
import { API_URL } from "@/lib/api";

const BASE_URL = API_URL.replace("/api", "");

export function EventCard({ e, joined = false, onMembershipChange }: { e: Activity; joined?: boolean; onMembershipChange?: () => void }) {
  const [isJoined, setIsJoined] = useState(joined);
  const [loading, setLoading] = useState(false);
  const category = getActivityCategory(e);

  const toggle = async () => {
    setLoading(true);
    try {
      if (isJoined) {
        await leaveActivity(e.id);
        setIsJoined(false);
        toast.success("Désinscrit de l'activité");
      } else {
        await joinActivity(e.id);
        setIsJoined(true);
        toast.success("Inscription confirmée !");
      }
      onMembershipChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative h-40 w-full overflow-hidden bg-linear-to-br from-primary via-primary-soft to-background flex items-center justify-center text-5xl">
        {e.imageUrl ? (
          <img src={`${BASE_URL}${e.imageUrl}`} alt={e.title} className="h-full w-full object-cover" />
        ) : (
          <span>{category === "Sportif" ? "⚽" : category === "Académique" ? "📚" : category === "Culturel" ? "🎨" : "🎉"}</span>
        )}
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-1">{e.title}</h3>
          <span className="shrink-0 rounded-full bg-primary-soft/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {category}
          </span>
        </div>
        
        {/* Participants Avatars */}
        {((e as any).participantAvatars?.length > 0) && (
          <div className="mb-4 flex items-center">
            <div className="flex -space-x-2 overflow-hidden">
              {(e as any).participantAvatars.map((url: string, i: number) => (
                <div key={i} className="inline-block h-7 w-7 rounded-full border-2 border-card bg-muted overflow-hidden">
                  {url ? (
                    <img src={`${BASE_URL}${url}`} alt="P" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary-soft text-[10px] text-primary"><UserIcon className="h-3 w-3" /></div>
                  )}
                </div>
              ))}
            </div>
            {e.currentParticipants && e.currentParticipants > 5 && (
              <span className="ml-2 text-xs text-muted-foreground">+{e.currentParticipants - 5}</span>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatActivityDate(e.startDate)}</div>
          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{e.location || "Lieu à confirmer"}</div>
          <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{e.currentParticipants || 0} participants</div>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isJoined
              ? "bg-success text-success-foreground"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {loading ? "Mise à jour..." : isJoined ? "Inscrit ✓" : "S'inscrire"}
        </button>
      </div>
    </div>
  );
}
