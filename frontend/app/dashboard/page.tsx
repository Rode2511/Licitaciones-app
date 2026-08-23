"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import {
  apiFetch,
} from "@/lib/api";


export default function Dashboard() {
  const router = useRouter();


  const [clients, setClients] =
    useState(0);


  const [products, setProducts] =
    useState(0);


  const [tenders, setTenders] =
    useState(0);


  const [users, setUsers] =
    useState<number | null>(null);


  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    const token =
      localStorage.getItem(
        "access_token"
      );


    if (!token) {

      router.push("/");

      return;

    }


    loadDashboard();

  }, [router]);


  async function loadDashboard() {

    try {

      const [
        clientsResponse,
        productsResponse,
        tendersResponse,
        usersResponse,
      ] = await Promise.all([

        apiFetch("/clients/"),

        apiFetch("/products/"),

        apiFetch("/tenders/"),

        apiFetch("/users/"),

      ]);


      if (
        clientsResponse.status === 401 ||
        productsResponse.status === 401 ||
        tendersResponse.status === 401 ||
        usersResponse.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );


        router.push("/");


        return;

      }


      const clientsData =
        await clientsResponse.json();


      const productsData =
        await productsResponse.json();


      const tendersData =
        await tendersResponse.json();


      setClients(
        Array.isArray(clientsData)
          ? clientsData.length
          : 0
      );


      setProducts(
        Array.isArray(productsData)
          ? productsData.length
          : 0
      );


      setTenders(
        Array.isArray(tendersData)
          ? tendersData.length
          : 0
      );


      // /users solo está permitido para admin.
      // Si responde correctamente, sabemos
      // que el usuario actual es administrador.
      if (usersResponse.ok) {

        const usersData =
          await usersResponse.json();


        setUsers(
          Array.isArray(usersData)
            ? usersData.length
            : 0
        );

      } else {

        setUsers(null);

      }


    } catch (error) {

      console.error(
        "Error cargando dashboard:",
        error
      );


    } finally {

      setLoading(false);

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


      {/* HEADER */}
      <header className="bg-white border-b border-zinc-200">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>

            <h1 className="text-xl font-bold text-zinc-900">
              Sistema de Licitaciones
            </h1>


            <p className="text-sm text-zinc-500">
              Panel de administración
            </p>

          </div>


          <button
            onClick={logout}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Cerrar sesión
          </button>

        </div>

      </header>


      <section className="max-w-7xl mx-auto px-6 py-10">


        <h2 className="text-2xl font-bold text-zinc-900">
          Dashboard
        </h2>


        <p className="text-zinc-500 mt-1">
          Gestión general del sistema
        </p>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">


          {/* CLIENTES */}
          <Link
            href="/clients"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition"
          >

            <p className="text-sm text-zinc-500">
              Clientes
            </p>


            <p className="text-3xl font-bold text-zinc-900 mt-2">
              {loading
                ? "..."
                : clients}
            </p>


            <p className="text-sm text-zinc-500 mt-4">
              Gestionar clientes →
            </p>

          </Link>


          {/* PRODUCTOS */}
          <Link
            href="/products"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition"
          >

            <p className="text-sm text-zinc-500">
              Productos
            </p>


            <p className="text-3xl font-bold text-zinc-900 mt-2">
              {loading
                ? "..."
                : products}
            </p>


            <p className="text-sm text-zinc-500 mt-4">
              Gestionar productos →
            </p>

          </Link>


          {/* LICITACIONES */}
          <Link
            href="/tenders"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition"
          >

            <p className="text-sm text-zinc-500">
              Licitaciones
            </p>


            <p className="text-3xl font-bold text-zinc-900 mt-2">
              {loading
                ? "..."
                : tenders}
            </p>


            <p className="text-sm text-zinc-500 mt-4">
              Gestionar licitaciones →
            </p>

          </Link>


          {/* USUARIOS - SOLO ADMIN */}
          {users !== null && (

            <Link
              href="/users"
              className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition"
            >

              <p className="text-sm text-zinc-500">
                Usuarios
              </p>


              <p className="text-3xl font-bold text-zinc-900 mt-2">
                {loading
                  ? "..."
                  : users}
              </p>


              <p className="text-sm text-zinc-500 mt-4">
                Gestionar usuarios →
              </p>

            </Link>

          )}

        </div>

      </section>

    </main>
  );
}