import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { StudentCardProfile } from "@/services/matchApi";
import { getOrCreateConversation } from "@/services/messagesApi";
import { MessageCircle, User, Sparkles, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import { getUser } from "@/lib/auth";

import { sendMentorRequest } from "@/services/mentorsApi";

const BASE_URL = API_URL.replace("/api", "");

export function StudentCard({ s }: { s: StudentCardProfile }) {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [contacting, setContacting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  
  const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const avatarUrl = s.avatar ? (s.avatar.startsWith("http") ? s.avatar : `${BASE_URL}${s.avatar}`) : null;
  const scoreColor =
    s.compatibility >= 85 ? "bg-success" : s.compatibility >= 70 ? "bg-primary" : "bg-warning";

  const contact = async () => {
    setContacting(true);
    try {
      const conversation = await getOrCreateConversation(s.id);
      navigate({ to: "/messages/$id", params: { id: conversation.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer la conversation");
    } finally {
      setContacting(false);
    }
  };

  const requestMentorship = async () => {
    if (!currentUser) return;
    setRequesting(true);
    try {
      await sendMentorRequest(s.id);
      toast.success(`Demande envoyée à ${s.name} !`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="group relative rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft overflow-hidden">
      {s.isAIRecommended && (
        <div className="absolute top-0 right-0 bg-warning/20 px-3 py-1 text-[10px] font-bold text-warning flex items-center gap-1 rounded-bl-xl border-l border-b border-warning/20">
          <Sparkles className="h-2.5 w-2.5" /> RECOMMANDÉ PAR L'IA
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={s.name} className="h-14 w-14 rounded-xl object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-lg font-bold text-primary">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{s.name}</h3>
          <p className="text-sm text-muted-foreground">
            {s.flag ? `${s.flag} ` : ""}{s.nationality}
          </p>
        </div>
        {s.isMentor && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
            Mentor
          </span>
        )}
      </div>

      {s.matchReason && (
        <div className="mt-3 rounded-lg bg-warning/5 border border-warning/10 p-2 text-[11px] text-warning italic flex gap-2 items-start">
          <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
          <span>« {s.matchReason} »</span>
        </div>
      )}

      <p className="mt-3 text-sm font-medium">{s.field}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {s.languages.slice(0, 3).map((l) => (
          <span key={l} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {l}
          </span>
        ))}
        {s.languages.length === 0 && <span className="text-xs text-muted-foreground">Langue non renseignée</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {s.interests.slice(0, 3).map((i) => (
          <span key={i} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
            {i}
          </span>
        ))}
        {s.interests.length === 0 && <span className="text-xs text-muted-foreground">Aucun intérêt renseigné</span>}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Compatibilité</span>
          <span className="font-semibold">{s.compatibility}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={`h-full ${scoreColor}`} style={{ width: `${s.compatibility}%` }} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {s.isMentor && currentUser?.id !== s.id && (
          <button
            type="button"
            onClick={requestMentorship}
            disabled={requesting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-sm font-semibold text-warning transition-colors hover:bg-warning/20 disabled:opacity-50"
          >
            <GraduationCap className="h-4 w-4" />
            {requesting ? "Envoi..." : "Demander un mentorat"}
          </button>
        )}
        <div className="flex gap-2">
          <Link
            to="/profile/$id"
            params={{ id: s.id }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <User className="h-4 w-4" /> Profil
          </Link>
          <button
            type="button"
            onClick={contact}
            disabled={contacting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> {contacting ? "Ouverture..." : "Contacter"}
          </button>
        </div>
      </div>
    </div>
  );
}
