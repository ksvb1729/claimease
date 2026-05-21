import React, { useState } from "react";

type Props = {
  onSuccess: (token: string) => void;
  onBack: () => void;
};

export default function LoginScreen({ onSuccess, onBack }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onSuccess(data.token);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-stage">
      <div className="login-screen">
        <div className="login-card">
          <div className="eyebrow">ClaimEase</div>
          <h1 className="login-title">Sign in to continue</h1>
          <p className="login-sub">
            ClaimEase is currently in limited access. Enter your credentials to proceed.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="login-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="login-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                disabled={loading}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="primary-btn login-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <button className="ghost-btn" style={{ marginTop: 12, width: "100%", textAlign: "center" }} onClick={onBack}>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
