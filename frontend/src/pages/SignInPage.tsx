import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SignInPage = () => {
  const [email, setEmail] = useState("customer@lepax.test");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to sign in");
    }
  };

  return (
    <section className="max-w-md mx-auto bg-black/40 p-6 rounded space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-gold">Welcome back</h1>
        <p className="text-silver/60">Sign in to shop, review and manage your account.</p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1 w-full rounded bg-charcoal border border-silver/20 px-3 py-2" />
        </label>
        <label className="block text-sm">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-1 w-full rounded bg-charcoal border border-silver/20 px-3 py-2" />
        </label>
        <button type="submit" className="bg-gold text-charcoal px-4 py-2 rounded w-full">
          Sign in
        </button>
      </form>
      {error && <p className="text-roseGold text-sm">{error}</p>}
      <div className="text-xs text-silver/60">
        <p>Or continue with:</p>
        <div className="flex gap-2 mt-2">
          <button className="flex-1 border border-silver/30 py-2 rounded">Google</button>
          <button className="flex-1 border border-silver/30 py-2 rounded">Facebook</button>
        </div>
      </div>
    </section>
  );
};

export default SignInPage;
