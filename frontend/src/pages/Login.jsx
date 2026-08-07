import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-zinc-900 p-8 rounded-lg w-96 space-y-4">
        <h1 className="text-2xl font-bold">Login to CodeClash</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
        />
        <button className="w-full bg-yellow-400 text-black font-bold p-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}