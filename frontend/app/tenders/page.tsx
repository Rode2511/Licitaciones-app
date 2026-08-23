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
};


type Tender = {
  id: number;
  client_id: number;
  title: string;
  description?: string | null;
  budget: number;
  deadline: string;
  status: string;
  proposal_url?: string | null;
};


export default function TendersPage() {
  const router = useRouter();

  const [tenders, setTenders] =
    useState<Tender[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [clientId, setClientId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [budget, setBudget] =
    useState("");

  const [deadline, setDeadline] =
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

    loadData();
  }, [router]);


  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        tendersResponse,
        clientsResponse,
      ] = await Promise.all([
        apiFetch("/tenders/"),
        apiFetch("/clients/"),
      ]);


      if (
        tendersResponse.status === 401 ||
        clientsResponse.status === 401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        router.push("/");

        return;
      }


      const tendersData =
        await tendersResponse.json();

      const clientsData =
        await clientsResponse.json();


      if (!tendersResponse.ok) {
        setError(
          tendersData.detail ||
          "No se pudieron cargar las licitaciones"
        );

        return;
      }


      if (!clientsResponse.ok) {
        setError(
          clientsData.detail ||
          "No se pudieron cargar los clientes"
        );

        return;
      }


      setTenders(
        Array.isArray(tendersData)
          ? tendersData
          : []
      );

      setClients(
        Array.isArray(clientsData)
          ? clientsData
          : []
      );

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


    if (!clientId) {
      setError(
        "Selecciona un cliente"
      );

      return;
    }


    const numericBudget =
      Number(budget);


    if (
      Number.isNaN(numericBudget) ||
      numericBudget <= 0
    ) {
      setError(
        "El presupuesto debe ser mayor que cero"
      );

      return;
    }


    if (!deadline) {
      setError(
        "Selecciona una fecha límite"
      );

      return;
    }


    setSaving(true);


    try {
      const response =
        await apiFetch(
          "/tenders/",
          {
            method: "POST",

            body: JSON.stringify({
              client_id:
                Number(clientId),

              title,

              description:
                description.trim() === ""
                  ? null
                  : description,

              budget:
                numericBudget,

              deadline:
                deadline.length === 16
                  ? `${deadline}:00`
                  : deadline,
            }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        setError(
          data.detail ||
          "No se pudo crear la licitación"
        );

        return;
      }


      setSuccess(
        `Licitación creada correctamente. ID: ${data.id}`
      );


      setClientId("");
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");


      await loadData();

    } catch {
      setError(
        "No se pudo conectar con el servidor"
      );

    } finally {
      setSaving(false);
    }
  }


  function getClientName(
    clientId: number
  ) {
    const client =
      clients.find(
        (item) =>
          item.id === clientId
      );


    if (!client) {
      return `Cliente #${clientId}`;
    }


    return `${client.name} - ${client.company}`;
  }


  function getStatusStyle(
    status: string
  ) {
    switch (status) {
      case "borrador":
        return "bg-zinc-100 text-zinc-700";

      case "activa":
        return "bg-blue-100 text-blue-700";

      case "finalizada":
        return "bg-purple-100 text-purple-700";

      case "por_cobrar":
        return "bg-yellow-100 text-yellow-800";

      case "cobrada":
        return "bg-green-100 text-green-700";

      case "perdida":
        return "bg-red-100 text-red-700";

      default:
        return "bg-zinc-100 text-zinc-700";
    }
  }


  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleString();
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
              Gestión de licitaciones
            </p>
          </div>


          <div className="flex items-center gap-3">

            <Link
              href="/clients"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Clientes
            </Link>


            <Link
              href="/products"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Productos
            </Link>


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
            Licitaciones
          </h2>

          <p className="text-zinc-500 mt-1">
            Crea y administra las licitaciones comerciales
          </p>

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Formulario */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 h-fit">

            <h3 className="text-lg font-semibold text-zinc-900">
              Nueva licitación
            </h3>


            {clients.length === 0 && !loading && (

              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">

                Debes crear al menos un cliente antes de crear una licitación.

              </div>

            )}


            <form
              onSubmit={handleSubmit}
              className="space-y-4 mt-6"
            >

              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Cliente
                </label>


                <select
                  required
                  value={clientId}
                  onChange={(event) =>
                    setClientId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 bg-white outline-none focus:border-zinc-900"
                >

                  <option value="">
                    Selecciona un cliente
                  </option>


                  {clients.map(
                    (client) => (

                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.name} - {client.company}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Título
                </label>


                <input
                  type="text"
                  required
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />

              </div>


              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Descripción
                </label>


                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900 resize-none"
                />

              </div>


              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Presupuesto máximo
                </label>


                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={budget}
                  onChange={(event) =>
                    setBudget(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />

              </div>


              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Fecha límite
                </label>


                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(event) =>
                    setDeadline(
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
                disabled={
                  saving ||
                  clients.length === 0
                }
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >

                {saving
                  ? "Guardando..."
                  : "Crear licitación"}

              </button>

            </form>

          </div>


          {/* Lista de licitaciones */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between">

              <div>

                <h3 className="font-semibold text-zinc-900">
                  Licitaciones registradas
                </h3>

                <p className="text-sm text-zinc-500 mt-1">
                  {tenders.length} licitaciones
                </p>

              </div>

            </div>


            {loading ? (

              <div className="p-6 text-zinc-500">
                Cargando licitaciones...
              </div>

            ) : tenders.length === 0 ? (

              <div className="p-6 text-zinc-500">
                No hay licitaciones registradas.
              </div>

            ) : (

              <div className="divide-y divide-zinc-200">

                {tenders.map(
                  (tender) => (

                    <div
                      key={tender.id}
                      className="p-6 hover:bg-zinc-50"
                    >

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                        <div>

                          <div className="flex items-center gap-3">

                            <h4 className="font-semibold text-zinc-900">
                              {tender.title}
                            </h4>


                            <span
                              className={`
                                rounded-full
                                px-2.5
                                py-1
                                text-xs
                                font-medium
                                ${getStatusStyle(
                                  tender.status
                                )}
                              `}
                            >
                              {tender.status}
                            </span>

                          </div>


                          <p className="text-sm text-zinc-500 mt-2">
                            ID #{tender.id}
                          </p>


                          <p className="text-sm text-zinc-600 mt-2">
                            {getClientName(
                              tender.client_id
                            )}
                          </p>


                          {tender.description && (

                            <p className="text-sm text-zinc-500 mt-2">
                              {tender.description}
                            </p>

                          )}


                          <div className="flex flex-wrap gap-6 mt-4 text-sm">

                            <div>

                              <span className="text-zinc-500">
                                Presupuesto:
                              </span>

                              <span className="ml-2 font-medium text-zinc-900">
                                $
                                {Number(
                                  tender.budget
                                ).toFixed(2)}
                              </span>

                            </div>


                            <div>

                              <span className="text-zinc-500">
                                Fecha límite:
                              </span>

                              <span className="ml-2 font-medium text-zinc-900">
                                {formatDate(
                                  tender.deadline
                                )}
                              </span>

                            </div>

                          </div>

                        </div>


                        <Link
                          href={`/tenders/${tender.id}`}
                          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 text-center"
                        >
                          Ver detalle
                        </Link>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </section>

    </main>
  );
}