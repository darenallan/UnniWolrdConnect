import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ArrowLeft, Send, Globe, Loader2, Sparkles, Mic, Square, Trash } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { getMe, getUserById } from "@/services/usersApi";
import { getConversationMeta, getIceBreakers, uploadAudio } from "@/services/messagesApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";

const BASE_URL = API_URL.replace("/api", "");

type Message = {
  id: string;
  senderId: string;
  text: string;
  type?: "text" | "audio";
  audioUrl?: string;
  translatedText?: string;
  createdAt?: string;
};

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: Chat,
});

function Chat() {
  const { id } = Route.useParams();
  const user = getUser();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await sendAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (err) {
      toast.error("Accès micro refusé");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setRecorder(null);
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (recorder) {
      recorder.onstop = null; // Don't send
      recorder.stop();
      setRecorder(null);
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const sendAudio = async (blob: Blob) => {
    const file = new File([blob], "voice.webm", { type: "audio/webm" });
    try {
      const { audioUrl } = await uploadAudio(file);
      const messageData = {
        senderId: user.id,
        text: "",
        type: "audio" as const,
        audioUrl,
        createdAt: new Date().toISOString(),
      };
      socket?.emit("sendMessage", { conversationId: id, message: messageData });
    } catch (err) {
      toast.error("Échec de l'envoi du vocal");
    }
  };

  // Charger l'historique
  useEffect(() => {
    apiRequest<{ messages: Message[] }>(`/messages/conversations/${id}`)
      .then((data) => setMsgs(data.messages))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Impossible de charger les messages"));
  }, [id]);

  // Charger les métadonnées de la conversation
  const { data: conv } = useQuery({
    queryKey: ["conversation", "meta", id],
    queryFn: () => getConversationMeta(id),
  });

  // Charger les Ice Breakers si la conversation est vide
  useEffect(() => {
    if (msgs.length === 0 && conv && conv.participants) {
      const otherId = conv.participants.find(p => p !== user.id);
      if (otherId) {
        Promise.all([getMe(), getUserById(otherId)])
          .then(([u1, u2]) => getIceBreakers(u1, u2))
          .then(setIcebreakers)
          .catch(console.error);
      }
    } else if (msgs.length > 0) {
      setIcebreakers([]);
    }
  }, [msgs.length, conv, user.id]);

  // Gérer le Socket
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinRoom", id);

    socket.on("receiveMessage", (message: Message) => {
      setMsgs((current) => {
        if (current.some((m) => m.id === message.id)) return current;
        return [...current, message];
      });
      setIsOtherTyping(false);
    });

    socket.on("typing", ({ userId }: { userId: string }) => {
      if (userId !== user.id) setIsOtherTyping(true);
    });

    socket.on("stopTyping", ({ userId }: { userId: string }) => {
      if (userId !== user.id) setIsOtherTyping(false);
    });

    return () => {
      socket.emit("leaveRoom", id);
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, id, user.id]);

  // Émettre l'événement de frappe
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    if (!socket) return;

    socket.emit("typing", { conversationId: id, userId: user.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { conversationId: id, userId: user.id });
    }, 2000);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    if (!text.trim() || !socket) return;

    const messageData = {
      senderId: user.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    socket.emit("sendMessage", {
      conversationId: id,
      message: messageData,
    });

    setText("");
    setIcebreakers([]);
  };

  const sendSpecificText = (txt: string) => {
    if (!socket) return;
    const messageData = {
      senderId: user.id,
      text: txt,
      createdAt: new Date().toISOString(),
    };
    socket.emit("sendMessage", { conversationId: id, message: messageData });
    setIcebreakers([]);
  };

  const translate = async (msg: Message) => {
    if (msg.translatedText) return;
    
    setIsTranslating(msg.id);
    try {
      const res = await apiRequest<{ translated: string }>("/ai/translate", {
        method: "POST",
        body: JSON.stringify({
          text: msg.text,
          targetLanguage: user.language === "Français" ? "fr" : "en",
        }),
      });

      setMsgs((current) =>
        current.map((m) => (m.id === msg.id ? { ...m, translatedText: res.translated } : m))
      );
    } catch (error) {
      toast.error("Échec de la traduction");
    } finally {
      setIsTranslating(null);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex items-center gap-3 border-b p-4">
        <Link to="/messages" className="rounded-lg p-1.5 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
          {id.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">Conversation</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> En ligne
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {msgs.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? "items-end" : "items-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              m.senderId === user.id ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
            }`}>
              {m.type === "audio" ? (
                <div className="flex items-center gap-2 py-1 min-w-[120px]">
                  <Mic className="h-4 w-4 shrink-0" />
                  <audio src={`${BASE_URL}${m.audioUrl}`} controls className="h-8 w-40 brightness-90 filter" />
                </div>
              ) : (
                m.text
              )}
            </div>
            {m.translatedText && (
              <div className="mt-1 max-w-[75%] rounded-xl bg-primary-soft px-3 py-1.5 text-xs italic text-primary animate-in fade-in slide-in-from-top-1">
                {m.translatedText}
              </div>
            )}
            <div className="mt-1 flex items-center gap-2 px-2">
              {m.senderId !== user.id && !m.translatedText && (
                <button
                  onClick={() => translate(m)}
                  disabled={isTranslating === m.id}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {isTranslating === m.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  Traduire
                </button>
              )}
            </div>
          </div>
        ))}

        {msgs.length === 0 && icebreakers.length > 0 && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Besoin d'aide pour commencer ?</p>
              <p className="text-xs text-muted-foreground">Voici quelques suggestions générées par l'IA :</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm px-4">
              {icebreakers.map((ib, i) => (
                <button
                  key={i}
                  onClick={() => sendSpecificText(ib)}
                  className="rounded-xl border bg-card p-3 text-left text-sm transition hover:border-warning hover:bg-warning/5 hover:shadow-sm active:scale-95"
                >
                  {ib}
                </button>
              ))}
            </div>
          </div>
        )}

        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-muted px-4 py-3 shadow-sm rounded-tl-none">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t p-3 bg-card">
        {isRecording ? (
          <div className="flex flex-1 items-center justify-between rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span>Enregistrement... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={cancelRecording} className="p-1 hover:bg-destructive/20 rounded-full transition-colors"><Trash className="h-4 w-4" /></button>
              <button onClick={stopRecording} className="p-1 hover:bg-destructive/20 rounded-full transition-colors"><Square className="h-4 w-4" /></button>
            </div>
          </div>
        ) : (
          <>
            <button 
              onClick={startRecording}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
            >
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Écrire un message..."
              className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary transition-colors focus:bg-background"
            />
            <button 
              onClick={send} 
              disabled={!text.trim() || !socket}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
            >
              <Send className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

