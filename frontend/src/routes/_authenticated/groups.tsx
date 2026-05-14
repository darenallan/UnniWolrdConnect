import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { languages } from "@/lib/constants";
import { Users, Check, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivities, joinActivity, leaveActivity, createActivity, type Activity } from "@/services/activitiesApi";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/groups")({
  component: Groups,
});

function Groups() {
  const queryClient = useQueryClient();
  const currentUser = getUser();
  const [lang, setLang] = useState("");
  const [open, setOpen] = useState(false);

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ["activities", "clubs"],
    queryFn: getActivities,
  });

  // Filtrer pour n'avoir que les clubs/groupes
  const allGroups = useMemo(() => 
    allActivities.filter(a => a.type === "club" || a.type === "group"), 
    [allActivities]
  );

  const list = lang ? allGroups.filter((g) => g.language === lang) : allGroups;
  
  const mine = allGroups.filter((g) => (g as any).participants?.includes(currentUser?.id));

  const joinMutation = useMutation({
    mutationFn: (id: string) => joinActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Action réussie !");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erreur"),
  });

  const leaveMutation = useMutation({
    mutationFn: (id: string) => leaveActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Vous avez quitté le groupe");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erreur"),
  });

  const Card = (g: Activity) => {
    const isMember = (g as any).participants?.includes(currentUser?.id);

    return (
      <div className="rounded-2xl border bg-card p-5 shadow-card transition hover:shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-2xl">
            {g.type === "club" ? "🍳" : "🌟"}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{g.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{g.description}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">{g.language || "Toutes"}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" /> {g.currentParticipants || 0}
          </span>
        </div>
        <button
          onClick={() => isMember ? leaveMutation.mutate(g.id) : joinMutation.mutate(g.id)}
          disabled={joinMutation.isPending || leaveMutation.isPending}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
            isMember ? "bg-success text-success-foreground" : "bg-muted hover:bg-primary-soft hover:text-primary"
          }`}
        >
          {joinMutation.isPending || leaveMutation.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 
           isMember ? <span className="flex items-center justify-center gap-1"><Check className="h-4 w-4" /> Membre</span> : "Rejoindre"}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Groupes & Communautés</h1>
          <p className="mt-1 text-muted-foreground">Rejoignez des étudiants qui partagent vos passions.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Créer un groupe
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Mes groupes</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mine.map((g) => <Card key={g.id} {...g} />)}
              </div>
            </section>
          )}

          <div className="flex gap-3">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Toutes langues</option>
              {languages.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((g) => <Card key={g.id} {...g} />)}
          </div>
        </>
      )}

      {open && <CreateGroupModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("Français");

  const mutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Groupe créé !");
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erreur"),
  });

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error("Tous les champs sont requis");
      return;
    }
    mutation.mutate({
      title: name.trim(),
      description: description.trim(),
      language,
      type: "club",
      tags: ["club", "group"],
    });
  };

  const cls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nouveau groupe</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={cls} placeholder="Tech & Code" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${cls} min-h-20`} placeholder="De quoi parle ce groupe ?" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Langue</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={cls}>
              {languages.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent">Annuler</button>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}


