import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMentorRequests, updateMentorRequestStatus } from "@/services/mentorsApi";
import { getOrCreateConversation } from "@/services/messagesApi";
import { Check, X, Loader2, User, Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const getDate = (dateObj: any) => {
  if (!dateObj) return new Date();
  if (dateObj._seconds) return new Date(dateObj._seconds * 1000);
  return new Date(dateObj);
};

export const Route = createFileRoute("/_authenticated/mentor-requests")({
  component: MentorRequests,
});

function MentorRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["mentors", "requests"],
    queryFn: getMentorRequests,
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, studentId }: { id: string; status: "accepted" | "rejected"; studentId?: string }) => {
      await updateMentorRequestStatus(id, status);
      
      // Si accepté, on crée la conversation automatiquement
      if (status === "accepted" && studentId) {
        try {
          await getOrCreateConversation(studentId);
        } catch (e) {
          console.error("Erreur création conversation:", e);
        }
      }
      return { status };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mentors", "requests"] });
      const msg = variables.status === "accepted" ? "Demande acceptée ! Conversation créée." : "Demande refusée.";
      toast.success(msg);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Une erreur est survenue"),
  });

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold">Demandes de mentorat</h1>
        <p className="mt-1 text-muted-foreground text-sm">Gérez les étudiants qui souhaitent que vous soyez leur mentor.</p>
      </div>

      {/* En attente */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-warning" />
          <h2 className="text-xl font-bold">En attente ({pending.length})</h2>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed bg-card/50 p-10 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucune nouvelle demande pour le moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pending.map((req) => (
              <div key={req.id} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-all hover:border-primary/50">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-xl font-bold text-primary shrink-0">
                    {req.studentName.slice(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{req.studentName}</h3>
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">Nouveau</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <p className="italic">"{req.message}"</p>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      Reçue le {format(getDate(req.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => updateRequestMutation.mutate({ id: req.id, status: "accepted", studentId: req.studentId })}
                      disabled={updateRequestMutation.isPending}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Accepter
                    </button>
                    <button
                      onClick={() => updateRequestMutation.mutate({ id: req.id, status: "rejected" })}
                      disabled={updateRequestMutation.isPending}
                      className="flex items-center gap-2 rounded-xl border-2 px-6 py-2.5 text-sm font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition active:scale-95 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historique */}
      {history.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 border-t pt-8">
            <ShieldCheck className="h-5 w-5 text-secondary" />
            <h2 className="text-xl font-bold">Historique</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-4">Étudiant</th>
                  <th className="p-4">Message</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((req) => (
                  <tr key={req.id} className="hover:bg-accent/30 transition-colors">
                    <td className="p-4 font-medium">{req.studentName}</td>
                    <td className="p-4 max-w-xs truncate italic text-muted-foreground">"{req.message}"</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {format(getDate(req.createdAt), "dd/MM/yyyy")}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {req.status === "accepted" ? "Accepté" : "Refusé"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
