import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";


export const Route = createFileRoute("/_authenticated/crm/opportunities/")({
  component: Opps,
  head: () => ({ meta: [{ title: "Opportunités — Nova CRM" }] }),
});

const STAGES = ["discovery", "qualification", "proposal", "negotiation", "won", "lost"] as const;
const STAGE_LABEL: Record<string, string> = {
  discovery: "Découverte",
  qualification: "Qualification",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagné",
  lost: "Perdu",
};

function Opps() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    contact_name: "",
    contact_email: "",
    stage: "discovery",
    value_amount: 0,
    description: "",
  });

  const oppsQ = useQuery({
    queryKey: ["opps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("crm_opportunities")
        .insert({ ...form, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success("Opportunité créée");
      qc.invalidateQueries({ queryKey: ["opps"] });
      setOpen(false);
      setForm({ name: "", company: "", contact_name: "", contact_email: "", stage: "discovery", value_amount: 0, description: "" });
      navigate({ to: "/crm/opportunities/$id", params: { id: data.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });


  const grouped = STAGES.map((s) => ({ stage: s, items: (oppsQ.data ?? []).filter((o: any) => o.stage === s) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Pipeline</p>
          <h1 className="font-display text-4xl font-bold text-white">Opportunités</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-white text-[#FF5722] hover:bg-white/90"><Plus className="mr-2 h-4 w-4"/>Nouvelle</Button>
          </DialogTrigger>
          <DialogContent className="border-white/20 bg-[#2a0f08] text-white">
            <DialogHeader><DialogTitle>Créer une opportunité</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Nom"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-white/30 bg-white/10 text-white" /></Field>
              <Field label="Entreprise"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="border-white/30 bg-white/10 text-white" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact"><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="border-white/30 bg-white/10 text-white" /></Field>
                <Field label="Email"><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="border-white/30 bg-white/10 text-white" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Étape">
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                    <SelectTrigger className="border-white/30 bg-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Valeur (€)"><Input type="number" value={form.value_amount} onChange={(e) => setForm({ ...form, value_amount: Number(e.target.value) })} className="border-white/30 bg-white/10 text-white" /></Field>
              </div>
              <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-white/30 bg-white/10 text-white" /></Field>
              <Button onClick={() => createMut.mutate()} disabled={!form.name || createMut.isPending} className="w-full rounded-full bg-white text-[#FF5722]">Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {grouped.map((col, idx) => (
          <motion.div key={col.stage} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="glass min-h-[200px] rounded-3xl p-4">
            <h3 className="mb-2 flex items-center justify-between text-sm font-semibold text-white">
              <span>{STAGE_LABEL[col.stage]}</span>
              <span className="rounded-full bg-white/20 px-2 text-xs">{col.items.length}</span>
            </h3>
            <div className="space-y-2">
              {col.items.map((o: any) => (
                <Link key={o.id} to="/crm/opportunities/$id" params={{ id: o.id }} className="block rounded-2xl bg-white/10 p-3 transition-all hover:bg-white/20">
                  <p className="truncate text-sm font-medium text-white">{o.name}</p>
                  <p className="truncate text-xs text-white/60">{o.company ?? "—"}</p>
                  <p className="mt-1 text-xs text-white/80">{Number(o.value_amount || 0).toLocaleString("fr-FR")} €</p>
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-white/80">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
