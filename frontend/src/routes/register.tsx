import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Loader2, ArrowLeft, ArrowRight, Camera, User as UserIcon } from "lucide-react";
import { saveSession, type User } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { countries, languages, interestsList, fields } from "@/lib/constants";
import { toast } from "sonner";
import { uploadAvatar } from "@/services/usersApi";

const schema = z
  .object({
    name: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(6, "Min 6 caractères")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre"),
    confirm: z.string(),
    nationality: z.string().min(1, "Requis"),
    language: z.string().min(1, "Requis"),
    university: z.string().min(2, "Requis"),
    field: z.string().min(1, "Requis"),
    interests: z.array(z.string()).min(1, "Choisissez au moins 1 intérêt"),
    isMentor: z.boolean().optional(),
    expertise: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, { message: "Les mots de passe diffèrent", path: ["confirm"] });
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, trigger, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { interests: [] },
    mode: "onTouched",
  });

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const stepFields: (keyof FormData)[][] = [
    ["name", "email", "password", "confirm"],
    ["nationality", "language", "university"],
    ["field", "interests"],
  ];

  const next = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(2, s + 1));
  };

  const toggleInterest = (i: string) => {
    const newList = selectedInterests.includes(i)
      ? selectedInterests.filter((x) => x !== i)
      : [...selectedInterests, i];
    setSelectedInterests(newList);
    setValue("interests", newList, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await apiRequest<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          country: data.nationality,
          language: data.language,
          major: data.field,
          role: data.isMentor ? "mentor" : "student",
          expertise: data.expertise,
          interests: data.interests,
        }),
      });
      
      saveSession(response.token, response.user);

      // Upload de l'avatar si présent
      if (avatarFile) {
        try {
          await uploadAvatar(avatarFile);
        } catch (err) {
          console.error("Erreur upload avatar:", err);
          toast.error("Compte créé, mais l'avatar n'a pas pu être envoyé");
        }
      }

      toast.success("Compte créé avec succès !");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      console.log("Validation errors:", errors);
      const firstError = Object.values(errors)[0] as any;
      toast.error(`Erreur : ${firstError.message || "Veuillez vérifier tous les champs"}`);
    }
  }, [errors]);

  const stepLabels = ["Identité", "Profil académique", "Intérêts"];

  return (
    <div className="min-h-screen bg-linear-to-br from-accent via-primary to-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl animate-fade-in rounded-3xl bg-card/85 p-8 shadow-soft backdrop-blur-sm border border-white/10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Globe className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Rejoignez StudentConnect</h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-medium">
            {stepLabels.map((l, i) => (
              <span key={l} className={i <= step ? "text-primary" : "text-muted-foreground"}>
                {i + 1}. {l}
              </span>
            ))}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 0 && (
            <>
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="relative group cursor-pointer">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-primary/20 bg-muted flex items-center justify-center transition group-hover:border-primary/50">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Ajouter une photo de profil (optionnel)</p>
              </div>

              <Field label="Nom complet" error={errors.name?.message}>
                <input {...register("name")} className={inputCls} placeholder="Votre nom" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input {...register("email")} type="email" className={inputCls} placeholder="vous@université.fr" />
              </Field>
              <Field label="Mot de passe" error={errors.password?.message}>
                <input {...register("password")} type="password" className={inputCls} />
              </Field>
              <Field label="Confirmer le mot de passe" error={errors.confirm?.message}>
                <input {...register("confirm")} type="password" className={inputCls} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Nationalité" error={errors.nationality?.message}>
                <select {...register("nationality")} className={inputCls}>
                  <option value="">— Choisir —</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Langue principale" error={errors.language?.message}>
                <select {...register("language")} className={inputCls}>
                  <option value="">— Choisir —</option>
                  {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Université" error={errors.university?.message}>
                <input {...register("university")} className={inputCls} placeholder="Sorbonne Université" />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Filière" error={errors.field?.message}>
                <select {...register("field")} className={inputCls}>
                  <option value="">— Choisir —</option>
                  {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Centres d'intérêt" error={errors.interests?.message as string | undefined}>
                <div className="flex flex-wrap gap-2">
                  {interestsList.map((i) => {
                    const selected = selectedInterests.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInterest(i)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary-soft/30 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" {...register("isMentor")} className="mt-1 h-4 w-4 accent-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Je veux aussi être mentor 🎓</p>
                    <p className="text-xs text-muted-foreground">Aidez d'autres étudiants internationaux à s'intégrer.</p>
                  </div>
                </label>
                <Field label="Domaine d'expertise (si mentor)">
                  <input {...register("expertise")} className={inputCls} placeholder="Ex: Démarches administratives, IA, Finance..." />
                </Field>
              </div>
            </>
          )}

          <div className="flex justify-between gap-3 pt-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
            ) : <div />}
            {step < 2 ? (
              <button
                type="button"
                onClick={next}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Suivant <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer mon compte
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
