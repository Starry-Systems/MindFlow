import { useState } from "react";

export default function AuthForm({ onAuth }: { onAuth: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      onAuth(data.token);
    } else {
      setError(data.error || "Authentication failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{mode === "signin" ? "Sign In" : "Sign Up"}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">{mode === "signin" ? "Sign In" : "Sign Up"}</button>
      <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}