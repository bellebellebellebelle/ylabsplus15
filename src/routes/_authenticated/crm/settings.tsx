import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resetAccount } from "@/crm/lib/google.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Paramètres — Nova CRM" }] }),
});

function Settings() {
  const qc = useQueryClient();
  const resetFn = useServerFn(resetAccount);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      return data;
    },
  });

  const resetMut = useMutation({
    mutationFn: () => resetFn({}),
    onSuccess: () => { toast.success("Compte réinitialisé"); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Configuration</p>
        <h1 className="font-display text-4xl font-bold text-white">Paramètres</h1>
      </div>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold text-white">Modèle d'IA</h2>
        <p className="text-sm text-white/70">Le modèle de Nova CRM se choisit dans le Laboratoire : Paramètres → Modèles d'IA.</p>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold text-white">Fuseau horaire</h2>
        <p className="mb-3 text-sm text-white/70">Les dates et heures (emails, rendez-vous, Target Day) s'afficheront dans ce fuseau.</p>
        <Select
          value={(profileQ.data as any)?.timezone ?? "Indian/Reunion"}
          onValueChange={async (tz) => {
            await supabase.from("profiles").update({ timezone: tz } as any).eq("id", (profileQ.data as any).id);
            toast.success("Fuseau horaire mis à jour");
            qc.invalidateQueries({ queryKey: ["profile"] });
            qc.invalidateQueries({ queryKey: ["profile-tz"] });
          }}
        >
          <SelectTrigger className="border-white/30 bg-white/10 text-white"><SelectValue/></SelectTrigger>
          <SelectContent>
            {["Indian/Reunion","Indian/Mauritius","Europe/Paris","Europe/London","Africa/Johannesburg","America/New_York","America/Los_Angeles","Asia/Dubai","Asia/Singapore","Asia/Tokyo","Australia/Sydney","UTC"].map(tz => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>


      <section className="glass rounded-3xl border border-red-300/30 p-6">
        <h2 className="font-display text-lg font-semibold text-white">Zone dangereuse</h2>
        <p className="mb-3 text-sm text-white/70">Réinitialise entièrement votre compte : opportunités, contacts, analyses IA et fichiers associés. Action irréversible.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="rounded-full">
              <Trash2 className="mr-2 h-4 w-4" />Réinitialiser mon compte
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-white/20 bg-[#2a0f08] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la réinitialisation ?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                Toutes les opportunités, contacts, activités, analyses IA et dossiers Drive créés par Nova CRM seront supprimés définitivement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 text-white">Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetMut.mutate()} className="bg-red-500 hover:bg-red-600">
                {resetMut.isPending ? "Réinitialisation…" : "Tout supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
