import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { isAuthed } from "@/lib/auth";
import { Bot } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthed()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    socket.on("newNotification", (notif: { type: string; senderName: string; text: string; conversationId: string }) => {
      // Ne pas afficher de toast si on est déjà sur la page de conversation
      if (window.location.pathname.includes(`/messages/${notif.conversationId}`)) return;

      toast(notif.senderName, {
        description: notif.text,
        action: {
          label: "Répondre",
          onClick: () => navigate({ to: "/messages/$id", params: { id: notif.conversationId } }),
        },
      });
    });

    return () => {
      socket.off("newNotification");
    };
  }, [socket, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-64">
        <div key={typeof window !== "undefined" ? window.location.pathname : ""} className="animate-fade-in p-4 md:p-8">
          <Outlet />
        </div>
        <Link
          to="/assistant"
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-105"
        >
          <Bot className="h-5 w-5" /> Assistant IA
        </Link>
      </main>
    </div>
  );
}
