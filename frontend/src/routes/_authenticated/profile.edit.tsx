import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { getUser, type User } from "@/lib/auth";
import { getMe, updateMe, uploadAvatar } from "@/services/usersApi";
import { countries, fields, languages, interestsList } from "@/lib/constants";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  component: EditProfile,
});

const BASE_URL = API_URL.replace("/api", "");

function EditProfile() {
  const navigate = useNavigate();
  const u = getUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(u.avatar ? (u.avatar.startsWith("http") ? u.avatar : `${BASE_URL}${u.avatar}`) : null);
  const [loading, setLoading] = useState(false);
  const [interests, setInterests] = useState<string[]>(u.interests || []);
  const [langs, setLangs] = useState<string[]>(u.languages || (u.language ? [u.language] : []));
  const [isMentor, setIsMentor] = useState<boolean>(!!u.isMentor);

  const { register, handleSubmit, reset } = useForm<User>({
    defaultValues: u,
  });

  useEffect(() => {
    getMe()
      .then((profile) => {
        const formUser = {
          ...profile,
          nationality: profile.country,
          field: profile.major,
          isMentor: profile.role === "mentor",
        };
        reset(formUser);
        setInterests(profile.interests || []);
        setLangs(profile.language ? [profile.language] : []);
        setIsMentor(profile.role === "mentor");
        if (profile.avatar) {
          setAvatar(profile.avatar.startsWith("http") ? profile.avatar : `${BASE_URL}${profile.avatar}`);
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Impossible de charger le profil"));
  }, [reset]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setLoading(true);
    try {
      const res = await uploadAvatar(f);
      setAvatar(`${BASE_URL}${res.avatarUrl}`);
      toast.success("Photo de profil mise à jour !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'upload");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const onSubmit = async (data: User) => {
    setLoading(true);
    try {
      await updateMe({
        name: data.name,
        country: data.nationality,
        language: langs[0] || data.language,
        major: data.field,
        interests,
        bio: data.bio,
      });
      toast.success("Profil mis à jour !");
      navigate({ to: "/profile/me" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour le profil");
    } finally {
      setLoading(false);
    }
  };

  const initials = (u.name || "ÉT").split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Modifier mon profil</h1>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex flex-col items-center">
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-3xl font-bold text-primary">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nom"><input {...register("name")} className={inputCls} /></Field>
          <Field label="Université"><input {...register("university")} className={inputCls} /></Field>
          <Field label="Nationalité">
            <select {...register("nationality")} className={inputCls}>
              <option value="">— Choisir —</option>
              {countries.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Filière">
            <select {...register("field")} className={inputCls}>
              <option value="">— Choisir —</option>
              {fields.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Biographie">
            <textarea {...register("bio")} rows={3} className={inputCls} placeholder="Présentez-vous en quelques mots..." />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Langues parlées">
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggle(l, langs, setLangs)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    langs.includes(l) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary-soft"
                  }`}
                >{l}</button>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Centres d'intérêt">
            <div className="flex flex-wrap gap-2 mb-3">
              {interestsList.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i, interests, setInterests)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    interests.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary-soft"
                  }`}
                >{i}</button>
              ))}
              {/* Afficher aussi les intérêts personnalisés déjà présents */}
              {interests.filter(i => !interestsList.includes(i)).map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i, interests, setInterests)}
                  className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                >{i}</button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input 
                id="custom-interest"
                type="text" 
                placeholder="Autre intérêt..." 
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !interests.includes(val)) {
                      setInterests([...interests, val]);
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("custom-interest") as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !interests.includes(val)) {
                    setInterests([...interests, val]);
                    input.value = "";
                  }
                }}
                className="rounded-lg bg-muted px-4 text-sm font-medium hover:bg-primary-soft"
              >
                Ajouter
              </button>
            </div>
          </Field>
        </div>

        <label className="mt-6 flex cursor-pointer items-center justify-between rounded-lg bg-muted p-3">
          <span className="text-sm font-medium">Je souhaite être mentor</span>
          <button
            type="button"
            onClick={() => toast.info("La demande de rôle mentor sera connectée dans la migration mentors.")}
            className={`relative h-6 w-11 rounded-full transition ${isMentor ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${isMentor ? "left-[1.4rem]" : "left-0.5"}`} />
          </button>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Enregistrer
      </button>
    </form>
  );
}

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
