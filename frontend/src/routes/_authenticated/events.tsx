import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { getActivities, getActivityCategory, createActivity } from "@/services/activitiesApi";
import { Plus, Search, Loader2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadActivityImage } from "@/services/activitiesApi";

export const Route = createFileRoute("/_authenticated/events")({
  component: Events,
});

const cats = ["Tous", "Culturel", "Sportif", "Académique", "Social", "event", "club", "activity"] as const;

function Events() {
  const [cat, setCat] = useState<(typeof cats)[number]>("Tous");
  const [open, setOpen] = useState(false);

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });

  const list = useMemo(() => {
    return cat === "Tous" ? activities : activities.filter((activity) => {
      const category = getActivityCategory(activity);
      return category === cat || activity.type === cat || activity.tags?.includes(cat);
    });
  }, [activities, cat]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Événements recommandés</h1>
          <p className="mt-1 text-muted-foreground">Rencontres, sport, culture — il y en a pour tous.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Créer un événement
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              cat === c ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">Aucune activité trouvée</p>
          <p className="text-sm text-muted-foreground">Essayez un autre filtre ou ajoutez des activités dans la base de données.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <EventCard key={e.id} e={e} onMembershipChange={() => refetch()} />)}
        </div>
      )}

      {open && <CreateEventModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function CreateEventModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("event");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const activity = await createActivity(data);
      if (imageFile) {
        await uploadActivityImage(activity.id, imageFile);
      }
      return activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Événement créé !");
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erreur"),
  });

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Titre et description requis");
      return;
    }
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || "À confirmer",
      type: type as any,
      tags: [type],
    });
  };

  const cls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nouvel événement</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={cls} placeholder="Soirée internationale" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Image de couverture</label>
            <div className="flex items-center gap-3">
              <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-3 text-sm transition hover:bg-accent">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-muted-foreground">
                  {imageFile ? imageFile.name : "Choisir une image..."}
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                />
              </label>
              {imageFile && (
                <button type="button" onClick={() => setImageFile(null)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${cls} min-h-20`} placeholder="Détails de l'événement..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Lieu</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={cls} placeholder="Campus Sorbonne" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Catégorie</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={cls}>
              <option value="event">Événement</option>
              <option value="activity">Activité</option>
              <option value="Social">Social</option>
              <option value="Culturel">Culturel</option>
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


