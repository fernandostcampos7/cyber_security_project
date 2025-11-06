import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";

const AccountSettingsPage = () => {
  const { user } = useAuth();
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const exportMutation = useMutation({ mutationFn: async () => console.info("Export requested") });
  const deleteMutation = useMutation({ mutationFn: async () => console.info("Deletion requested") });

  const handleConsentChange = (event: FormEvent<HTMLInputElement>) => {
    setAnalyticsConsent(event.currentTarget.checked);
  };

  return (
    <section className="space-y-4 max-w-2xl">
      <header>
        <h1 className="text-3xl font-semibold text-gold">Account settings</h1>
        <p className="text-silver/60">Manage your profile and privacy preferences.</p>
      </header>
      <div className="bg-black/30 rounded p-4">
        <p className="text-sm text-silver/80">Signed in as {user?.email}</p>
        <p className="text-xs text-silver/60">Role: {user?.role}</p>
      </div>
      <div className="bg-black/30 rounded p-4 space-y-2">
        <h2 className="text-sm uppercase tracking-widest text-silver/60">Analytics consent</h2>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={analyticsConsent} onChange={handleConsentChange} className="accent-gold" />
          <span className="text-sm text-silver/70">Allow anonymised analytics for experience optimisation.</span>
        </label>
      </div>
      <div className="bg-black/30 rounded p-4 space-y-2">
        <h2 className="text-sm uppercase tracking-widest text-silver/60">Data subject rights</h2>
        <button onClick={() => exportMutation.mutate()} className="bg-gold text-charcoal px-3 py-2 rounded">
          Request export
        </button>
        <button onClick={() => deleteMutation.mutate()} className="bg-roseGold text-charcoal px-3 py-2 rounded">
          Request deletion
        </button>
      </div>
    </section>
  );
};

export default AccountSettingsPage;
