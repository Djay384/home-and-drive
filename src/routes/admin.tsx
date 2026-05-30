import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListVehicles,
  adminUpdateVehicle,
  adminVehicleHistory,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
});

function AdminPage() {
  const [session, setSession] = useState<null | { user: { email?: string } }>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { user: { email: data.session.user.email ?? undefined } } : null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { user: { email: s.user.email ?? undefined } } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
  if (!session) return <LoginForm />;
  return <VehiclesAdmin email={session.user.email} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold mb-1">Administration</h1>
        <p className="text-sm text-muted-foreground mb-6">Connectez-vous pour gérer le catalogue.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function VehiclesAdmin({ email }: { email?: string }) {
  const listFn = useServerFn(adminListVehicles);
  const updateFn = useServerFn(adminUpdateVehicle);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "vehicles"],
    queryFn: () => listFn(),
  });

  const mutation = useMutation({
    mutationFn: (input: { id: string; price_per_day: number; description: string | null }) =>
      updateFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "vehicles"] }),
  });

  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Catalogue véhicules</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Déconnexion</Button>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="space-y-4">
        {data?.map((v) => (
          <VehicleRow
            key={v.id}
            vehicle={v}
            onSave={(payload) => mutation.mutateAsync(payload)}
            saving={mutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function VehicleRow({
  vehicle,
  onSave,
  saving,
}: {
  vehicle: { id: string; name: string; description: string | null; price_per_day: number | string };
  onSave: (p: { id: string; price_per_day: number; description: string | null }) => Promise<unknown>;
  saving: boolean;
}) {
  const [price, setPrice] = useState(String(vehicle.price_per_day));
  const [description, setDescription] = useState(vehicle.description ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const historyFn = useServerFn(adminVehicleHistory);
  const { data: history, isFetching: loadingHistory, refetch } = useQuery({
    queryKey: ["admin", "vehicle-history", vehicle.id],
    queryFn: () => historyFn({ data: { vehicleId: vehicle.id } }),
    enabled: showHistory,
  });

  async function save() {
    setStatus(null);
    try {
      await onSave({
        id: vehicle.id,
        price_per_day: Number(price),
        description: description.trim() ? description.trim() : null,
      });
      setStatus("✓ Enregistré");
      if (showHistory) refetch();
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  return (
    <Card className="p-4">
      <h2 className="font-medium mb-3">{vehicle.name}</h2>
      <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto] items-end">
        <div>
          <Label>Prix / jour (€)</Label>
          <Input type="number" min={0} step="1" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving}>Enregistrer</Button>
      </div>
      {status && <p className="text-xs mt-2 text-muted-foreground">{status}</p>}

      <div className="mt-3 border-t pt-3">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={() => setShowHistory((s) => !s)}
        >
          {showHistory ? "Masquer l'historique" : "Voir l'historique des modifications"}
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {loadingHistory && <p className="text-xs text-muted-foreground">Chargement…</p>}
            {!loadingHistory && history && history.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune modification enregistrée.</p>
            )}
            {history?.map((h) => (
              <div key={h.id} className="text-xs border rounded p-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{h.field === "price_per_day" ? "Prix" : "Description"}</span>
                    {" · "}
                    {h.changed_by_email ?? "admin"}
                  </span>
                  <span>{new Date(h.created_at).toLocaleString("fr-FR")}</span>
                </div>
                <div className="mt-1">
                  <span className="line-through text-muted-foreground">{h.old_value ?? "—"}</span>
                  {" → "}
                  <span className="font-medium">{h.new_value ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
