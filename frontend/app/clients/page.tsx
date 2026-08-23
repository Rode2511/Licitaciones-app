"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  apiFetch,
} from "@/lib/api";


type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
};


export default function ClientsPage() {
  const router = useRouter();

  const [clients, setClients] =
    useState<Client[]>([]);

  const [name, setName] =
    useState("");

  const [company, setCompany] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  useEffect(() => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.push("/");
      return;
    }

    loadClients();
  }, [router]);


  async function loadClients() {
    try {
      setLoading(true);

      const response =
        await apiFetch(
          "/clients/"
        );


      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        router.push("/");

        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        setError(
          data.detail ||
          "No se pudieron cargar los clientes"
        );

        return;
      }


      setClients(data);
    } catch {
      setError(
        "No se pudo conectar con el servidor"
      );
    } finally {
      setLoading(false);
    }
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);


    try {
      const response =
        await apiFetch(
          "/clients/",
          {
            method: "POST",

            body: JSON.stringify({
              name,
              company,
              email,
              phone:
                phone.trim() === ""
                  ? null
                  : phone,
            }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        setError(
          data.detail ||
          "No se pudo crear el cliente"
        );

        return;
      }


      setSuccess(
        "Cliente creado correctamente"
      );


      setName("");
      setCompany("");
      setEmail("");
      setPhone("");


      await loadClients();
    } catch {
      setError(
        "No se pudo conectar con el servidor"
      );
    } finally {
      setSaving(false);
    }
  }


  function logout() {
    localStorage.removeItem(
      "access_token"
    );

    router.push("/");
  }


  return (
    <main className="min-h-screen bg-zinc-100">

      <header className="bg-white border-b border-zinc-200">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Sistema de Licitaciones
            </h1>

            <p className="text-sm text-zinc-500">
              Gestión de clientes
            </p>
          </div>


          <div className="flex items-center gap-3">

            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Dashboard
            </Link>


            <button
              onClick={logout}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </header>


      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900">
            Clientes
          </h2>

          <p className="text-zinc-500 mt-1">
            Crea y consulta los clientes registrados
          </p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Formulario */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 h-fit">

            <h3 className="text-lg font-semibold text-zinc-900">
              Nuevo cliente
            </h3>


            <form
              onSubmit={handleSubmit}
              className="space-y-4 mt-6"
            >

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Nombre
                </label>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Empresa
                </label>

                <input
                  type="text"
                  required
                  value={company}
                  onChange={(event) =>
                    setCompany(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Correo
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Teléfono
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>


              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}


              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              )}


              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : "Crear cliente"}
              </button>

            </form>

          </div>


          {/* Lista */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-zinc-200">
              <h3 className="font-semibold text-zinc-900">
                Clientes registrados
              </h3>
            </div>


            {loading ? (

              <div className="p-6 text-zinc-500">
                Cargando clientes...
              </div>

            ) : clients.length === 0 ? (

              <div className="p-6 text-zinc-500">
                No hay clientes registrados.
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-zinc-50 text-left">

                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold uppercase text-zinc-500">
                        ID
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase text-zinc-500">
                        Cliente
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase text-zinc-500">
                        Empresa
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase text-zinc-500">
                        Correo
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase text-zinc-500">
                        Teléfono
                      </th>
                    </tr>

                  </thead>


                  <tbody className="divide-y divide-zinc-200">

                    {clients.map(
                      (client) => (

                        <tr
                          key={client.id}
                          className="hover:bg-zinc-50"
                        >

                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {client.id}
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                            {client.name}
                          </td>

                          <td className="px-6 py-4 text-sm text-zinc-600">
                            {client.company}
                          </td>

                          <td className="px-6 py-4 text-sm text-zinc-600">
                            {client.email}
                          </td>

                          <td className="px-6 py-4 text-sm text-zinc-600">
                            {client.phone || "—"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </section>

    </main>
  );
}