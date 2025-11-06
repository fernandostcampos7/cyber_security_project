import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post("/auth/register", { email, password, display_name: displayName });
      navigate("/signin");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to sign up");
    }
  };

  return (
    <section className="max-w-md mx-auto bg-black/40 p-6 rounded space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-gold">Join LePax</h1>
        <p className="text-silver/60">Create an account to manage orders, wishlists and reviews.</p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          Display name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded bg-charcoal border border-silver/20 px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1 w-full rounded bg-charcoal border border-silver/20 px-3 py-2" />
        </label>
        <label className="block text-sm">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-1 w-full rounded bg-charcoal border border-silver/20 px-3 py-2" />
        </label>
        <button type="submit" className="bg-gold text-charcoal px-4 py-2 rounded w-full">
          Sign up
        </button>
      </form>
      {error && <p className="text-roseGold text-sm">{error}</p>}
    </section>
  );
};

export default SignUpPage;
