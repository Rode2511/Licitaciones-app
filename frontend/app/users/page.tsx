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


type User = {
  id: number;
  email: string;
  role: string;
};


export default function UsersPage() {
  const router = useRouter();


  const [users, setUsers] =
    useState<User[]>([]);


  const [email, setEmail] =
    useState("");


  const [password, setPassword] =
    useState("");


  const [role, setRole] =
    useState("user");


  const [loading, setLoading] =
    useState(true);


  const [saving, setSaving] =
    useState(false);


  const [forbidden, setForbidden] =
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


    loadUsers();

  }, [router]);


  async function loadUsers() {
    try {
      setLoading(true);
      setError("");


      const response =
        await apiFetch(
          "/users/"
        );


      if (response.status === 401) {

        localStorage.removeItem(
          "access_token"
        );

        router.push("/");

        return;
      }


      if (response.status === 403) {

        setForbidden(true);

        return;
      }


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudieron cargar los usuarios"
        );

        return;
      }


      setUsers(
        Array.isArray(data)
          ? data
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


    if (
      password.length < 6
    ) {

      setError(
        "La contraseña debe tener al menos 6 caracteres"
      );

      return;

    }


    setSaving(true);


    try {

      const response =
        await apiFetch(
          "/users/",
          {
            method: "POST",

            body: JSON.stringify({
              email,
              password,
              role,
            }),
          }
        );


      const data =
        await response.json();


      if (response.status === 403) {

        setForbidden(true);

        return;

      }


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudo crear el usuario"
        );

        return;

      }


      setSuccess(
        "Usuario creado correctamente"
      );


      setEmail("");
      setPassword("");
      setRole("user");


      await loadUsers();


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


  if (loading) {

    return (
      <main className="min-h-screen bg-zinc-100 flex items-center justify-center">

        <p className="text-zinc-500">
          Cargando usuarios...
        </p>

      </main>
    );

  }


  if (forbidden) {

    return (
      <main className="min-h-screen bg-zinc-100">

        <header className="bg-white border-b border-zinc-200">

          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

            <div>

              <h1 className="text-xl font-bold text-zinc-900">
                Sistema de Licitaciones
              </h1>

              <p className="text-sm text-zinc-500">
                Gestión de usuarios
              </p>

            </div>


            <div className="flex gap-3">

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


        <section className="max-w-3xl mx-auto px-6 py-16">

          <div className="bg-white rounded-xl border border-red-200 p-8">

            <h2 className="text-xl font-bold text-zinc-900">
              Acceso restringido
            </h2>


            <p className="text-zinc-600 mt-3">
              Solamente los administradores pueden gestionar usuarios.
            </p>


            <Link
              href="/dashboard"
              className="inline-block mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Volver al dashboard
            </Link>

          </div>

        </section>

      </main>
    );

  }


  return (
    <main className="min-h-screen bg-zinc-100">


      {/* HEADER */}
      <header className="bg-white border-b border-zinc-200">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>

            <h1 className="text-xl font-bold text-zinc-900">
              Sistema de Licitaciones
            </h1>

            <p className="text-sm text-zinc-500">
              Gestión de usuarios
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
              href="/tenders"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Licitaciones
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
            Usuarios
          </h2>


          <p className="text-zinc-500 mt-1">
            Crea y consulta los usuarios del sistema
          </p>

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


          {/* FORMULARIO */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 h-fit">

            <h3 className="text-lg font-semibold text-zinc-900">
              Nuevo usuario
            </h3>


            <p className="text-sm text-zinc-500 mt-2">
              Solamente un administrador puede crear usuarios.
            </p>


            <form
              onSubmit={handleSubmit}
              className="space-y-4 mt-6"
            >


              {/* EMAIL */}
              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Correo electrónico
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


              {/* PASSWORD */}
              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Contraseña
                </label>


                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />


                <p className="text-xs text-zinc-500 mt-1">
                  Mínimo 6 caracteres.
                </p>

              </div>


              {/* ROLE */}
              <div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Rol
                </label>


                <select
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 bg-white outline-none focus:border-zinc-900"
                >

                  <option value="user">
                    Usuario
                  </option>

                  <option value="admin">
                    Administrador
                  </option>

                </select>

              </div>


              {/* ERROR */}
              {error && (

                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>

              )}


              {/* SUCCESS */}
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
                  ? "Creando..."
                  : "Crear usuario"}

              </button>

            </form>

          </div>


          {/* LISTADO */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-zinc-200">

              <h3 className="font-semibold text-zinc-900">
                Usuarios registrados
              </h3>


              <p className="text-sm text-zinc-500 mt-1">
                {users.length} usuarios
              </p>

            </div>


            {users.length === 0 ? (

              <div className="p-6 text-zinc-500">
                No hay usuarios registrados.
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
                        Correo
                      </th>


                      <th className="px-6 py-3 text-xs font-semibold uppercase text-zinc-500">
                        Rol
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-zinc-200">

                    {users.map(
                      (user) => (

                        <tr
                          key={user.id}
                          className="hover:bg-zinc-50"
                        >

                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {user.id}
                          </td>


                          <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                            {user.email}
                          </td>


                          <td className="px-6 py-4">

                            <span
                              className={
                                user.role === "admin"
                                  ? "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700"
                                  : "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                              }
                            >

                              {user.role}

                            </span>

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