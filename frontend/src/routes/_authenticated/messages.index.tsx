import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Search, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Conversation = {
  id: string;
  participants: string[];
  participantsInfo?: Record<string, { name?: string; avatar?: string }>;
  lastMessage?: string;
  lastMessageAt?: { _seconds?: number } | string;
};

export const Route = createFileRoute("/_authenticated/messages/")({
  component: Messages,
});

function Messages() {
  const [q, setQ] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const user = getUser();

  useEffect(() => {
    apiRequest<{ conversations: Conversation[] }>("/messages/conversations")
      .then((data) => setConversations(data.conversations))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Impossible de charger les conversations"));
  }, []);

  const getOtherParticipant = (conversation: Conversation) => {
    const otherId = conversation.participants.find((id) => id !== user.id);
    return conversation.participantsInfo?.[otherId || ""]?.name || "Conversation";
  };

  const filtered = conversations.filter((c) => getOtherParticipant(c).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-muted-foreground">Toutes vos conversations.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une conversation..."
          className="w-full rounded-xl border bg-card py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">Aucune conversation</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/messages/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 border-b p-4 last:border-0 hover:bg-accent"
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-xl">
                {getOtherParticipant(c).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">{getOtherParticipant(c)}</p>
                </div>
                <p className="truncate text-sm text-muted-foreground">{c.lastMessage || "Aucun message"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
