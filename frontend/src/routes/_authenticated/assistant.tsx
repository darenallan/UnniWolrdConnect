import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Plus, User } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { getMe } from "@/services/usersApi";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/assistant")({
  component: Assistant,
});

type Msg = { from: "user" | "ai"; text: string };

const suggestions = [
  "Comment obtenir mon titre de séjour ?",
  "Quels documents pour l'université ?",
  "Comment trouver un logement ?",
  "Quels sont mes droits d'étudiant ?",
];

function Assistant() {
  const { data: user } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMe,
  });

  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "Bonjour ! Je suis votre assistant étudiant. Comment puis-je vous aider aujourd'hui ?" },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = async (q?: string) => {
    const content = (q ?? text).trim();
    if (!content) return;
    const history = msgs.map((m) => ({
      role: m.from === "user" ? "Utilisateur" : "Assistant",
      content: m.text,
    }));

    setMsgs((m) => [...m, { from: "user", text: content }]);
    setText("");
    setTyping(true);

    try {
      const response = await apiRequest<{ reply: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ 
          message: content, 
          history,
          userContext: user ? {
            name: user.name,
            country: user.country,
            major: user.major,
            interests: user.interests,
          } : {}
        }),
      });

      setMsgs((m) => [...m, { from: "ai", text: response.reply }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de contacter l'assistant IA");
      setMsgs((m) => [...m, { from: "ai", text: "Désolé, l'assistant IA est momentanément indisponible." }]);
    } finally {
      setTyping(false);
    }
  };

  const reset = () => {
    setMsgs([{ from: "ai", text: "Bonjour ! Nouvelle conversation. Comment puis-je vous aider ?" }]);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Assistant Étudiant IA</p>
            <p className="text-xs text-muted-foreground">Disponible 24/7</p>
          </div>
        </div>
        <button onClick={reset} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent">
          <Plus className="h-4 w-4" /> Nouvelle conversation
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            {m.from === "ai" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
              m.from === "user" ? "bg-primary text-primary-foreground" : "bg-primary-soft text-foreground"
            }`}>
              {m.text}
            </div>
            {m.from === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex gap-1 rounded-2xl bg-primary-soft px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary bounce-dot" />
              <span className="h-2 w-2 rounded-full bg-primary bounce-dot" style={{ animationDelay: "0.15s" }} />
              <span className="h-2 w-2 rounded-full bg-primary bounce-dot" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}

        {msgs.length === 1 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-xl border bg-card p-3 text-left text-sm transition hover:border-primary hover:bg-primary-soft"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Posez votre question..."
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={() => send()} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
