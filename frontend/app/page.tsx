"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "No se pudo iniciar sesión"
        );

        return;
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      router.push("/dashboard");
    } catch {
      setError(
        "No se pudo conectar con el servidor"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">
            Sistema de Licitaciones
          </h1>

          <p className="text-zinc-500 mt-2">
            Inicia sesión para continuar
          </p>
        </div>


        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900"
            />
          </div>


          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900"
            />
          </div>


          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>

        </form>

      </div>
    </main>
  );
}