"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  apiFetch,
} from "@/lib/api";


// =========================================================
// TIPOS
// =========================================================

type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
};


type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
};


type TenderProduct = {
  id: number;
  name: string;
  description?: string | null;
  quantity: number;
  price: number;
};


type StatusHistory = {
  id: number;
  old_status: string;
  new_status: string;
  user_id?: number | null;
  user_email?: string | null;
  created_at: string;
};


type TenderDetail = {
  id: number;
  title: string;
  description?: string | null;
  budget: number;
  deadline: string;
  status: string;
  proposal_url?: string | null;

  client: Client;

  products: TenderProduct[];

  history: StatusHistory[];
};


type PaymentResult = {
  monto_pagado: number;
  total_facturado: number;
  total_pagado: number;
  saldo_pendiente: number;
  estado: string;
};


// =========================================================
// COMPONENTE
// =========================================================

export default function TenderDetailPage() {
  const router = useRouter();

  const params = useParams();

  const tenderId =
    Number(params.id);


  // =======================================================
  // ESTADOS
  // =======================================================

  const [
    tender,
    setTender,
  ] = useState<TenderDetail | null>(
    null
  );


  const [
    allProducts,
    setAllProducts,
  ] = useState<Product[]>([]);


  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");


  const [
    quantity,
    setQuantity,
  ] = useState("1");


  const [
    price,
    setPrice,
  ] = useState("");


  const [
    proposalFile,
    setProposalFile,
  ] = useState<File | null>(
    null
  );


  // Referencia al input oculto de PDF
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");


  const [
    paymentResult,
    setPaymentResult,
  ] = useState<PaymentResult | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  // =======================================================
  // CARGA INICIAL
  // =======================================================

  useEffect(() => {

    const token =
      localStorage.getItem(
        "access_token"
      );


    if (!token) {

      router.push("/");

      return;

    }


    if (
      Number.isNaN(
        tenderId
      )
    ) {

      setError(
        "ID de licitación inválido"
      );

      setLoading(false);

      return;

    }


    loadData();

  }, [router, tenderId]);


  // =======================================================
  // CARGAR DATOS
  // =======================================================

  async function loadData() {

    try {

      setLoading(true);


      const [
        tenderResponse,
        productsResponse,
      ] = await Promise.all([

        apiFetch(
          `/tenders/${tenderId}`
        ),

        apiFetch(
          "/products/"
        ),

      ]);


      if (
        tenderResponse.status === 401 ||
        productsResponse.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );

        router.push("/");

        return;

      }


      const tenderData =
        await tenderResponse.json();


      const productsData =
        await productsResponse.json();


      if (!tenderResponse.ok) {

        setError(
          tenderData.detail ||
          "No se pudo cargar la licitación"
        );

        return;

      }


      if (!productsResponse.ok) {

        setError(
          productsData.detail ||
          "No se pudieron cargar los productos"
        );

        return;

      }


      setTender(
        tenderData
      );


      setAllProducts(
        Array.isArray(
          productsData
        )
          ? productsData
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


  // =======================================================
  // LIMPIAR MENSAJES
  // =======================================================

  function clearMessages() {

    setError("");

    setSuccess("");

  }


  // =======================================================
  // CAMBIO DE PRODUCTO
  // =======================================================

  function handleProductChange(
    productId: string
  ) {

    setSelectedProductId(
      productId
    );


    const product =
      allProducts.find(
        (item) =>
          item.id ===
          Number(productId)
      );


    if (product) {

      setPrice(
        String(
          product.price
        )
      );

    } else {

      setPrice("");

    }

  }


  // =======================================================
  // AGREGAR PRODUCTO
  // =======================================================

  async function addProduct(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    clearMessages();


    const numericProductId =
      Number(
        selectedProductId
      );


    const numericQuantity =
      Number(
        quantity
      );


    const numericPrice =
      Number(
        price
      );


    if (!numericProductId) {

      setError(
        "Selecciona un producto"
      );

      return;

    }


    if (
      numericQuantity <= 0 ||
      Number.isNaN(
        numericQuantity
      )
    ) {

      setError(
        "La cantidad debe ser mayor que cero"
      );

      return;

    }


    if (
      numericPrice <= 0 ||
      Number.isNaN(
        numericPrice
      )
    ) {

      setError(
        "El precio debe ser mayor que cero"
      );

      return;

    }


    setActionLoading(true);


    try {

      const response =
        await apiFetch(
          `/tenders/${tenderId}/products`,
          {
            method: "POST",

            body:
              JSON.stringify({
                product_id:
                  numericProductId,

                quantity:
                  numericQuantity,

                price:
                  numericPrice,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudo agregar el producto"
        );

        return;

      }


      setSuccess(
        "Producto agregado correctamente"
      );


      setSelectedProductId("");

      setQuantity("1");

      setPrice("");


      await loadData();


    } catch {

      setError(
        "No se pudo conectar con el servidor"
      );


    } finally {

      setActionLoading(false);

    }

  }


  // =======================================================
  // QUITAR PRODUCTO
  // =======================================================

  async function removeProduct(
    productId: number
  ) {

    clearMessages();


    const confirmed =
      window.confirm(
        "¿Deseas quitar este producto de la licitación?"
      );


    if (!confirmed) {

      return;

    }


    setActionLoading(true);


    try {

      const response =
        await apiFetch(
          `/tenders/${tenderId}/products/${productId}`,
          {
            method: "DELETE",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudo eliminar el producto"
        );

        return;

      }


      setSuccess(
        "Producto eliminado correctamente"
      );


      await loadData();


    } catch {

      setError(
        "No se pudo conectar con el servidor"
      );


    } finally {

      setActionLoading(false);

    }

  }


  // =======================================================
  // SUBIR PROPUESTA PDF
  // =======================================================

  async function uploadProposal(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    clearMessages();


    if (!proposalFile) {

      setError(
        "Selecciona un archivo PDF"
      );

      return;

    }


    if (
      proposalFile.type &&
      proposalFile.type !==
        "application/pdf"
    ) {

      setError(
        "El archivo debe ser un PDF"
      );

      return;

    }


    const formData =
      new FormData();


    formData.append(
      "file",
      proposalFile
    );


    setActionLoading(true);


    try {

      const response =
        await apiFetch(
          `/tenders/${tenderId}/proposal`,
          {
            method: "POST",
            body: formData,
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudo subir la propuesta"
        );

        return;

      }


      setSuccess(
        "Propuesta subida correctamente"
      );


      setProposalFile(
        null
      );


      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";

      }


      await loadData();


    } catch {

      setError(
        "No se pudo conectar con el servidor"
      );


    } finally {

      setActionLoading(false);

    }

  }


  // =======================================================
  // ENVIAR LICITACIÓN
  // =======================================================

  async function sendTender() {

    clearMessages();


    const confirmed =
      window.confirm(
        "¿Deseas enviar esta licitación al cliente? Se enviará un correo real."
      );


    if (!confirmed) {

      return;

    }


    setActionLoading(true);


    try {

      const response =
        await apiFetch(
          `/tenders/${tenderId}/send`,
          {
            method: "POST",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudo enviar la licitación"
        );

        return;

      }


      setSuccess(
        "Licitación enviada correctamente"
      );


      await loadData();


    } catch {

      setError(
        "No se pudo conectar con el servidor"
      );


    } finally {

      setActionLoading(false);

    }

  }


  // =======================================================
  // CAMBIAR ESTADO
  // =======================================================

  async function changeStatus(
    newStatus: string
  ) {

    clearMessages();


    const confirmed =
      window.confirm(
        `¿Deseas cambiar el estado a "${newStatus}"?`
      );


    if (!confirmed) {

      return;

    }


    setActionLoading(true);


    try {

      const response =
        await apiFetch(
          `/tenders/${tenderId}/status`,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                new_status:
                  newStatus,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudo cambiar el estado"
        );

        return;

      }


      setSuccess(
        `Estado cambiado a ${newStatus}`
      );


      await loadData();


    } catch {

      setError(
        "No se pudo conectar con el servidor"
      );


    } finally {

      setActionLoading(false);

    }

  }


  // =======================================================
  // REGISTRAR PAGO
  // =======================================================

  async function registerPayment(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    clearMessages();


    const numericAmount =
      Number(
        paymentAmount
      );


    if (
      Number.isNaN(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      setError(
        "El monto debe ser mayor que cero"
      );

      return;

    }


    setActionLoading(true);


    try {

      const response =
        await apiFetch(
          `/payments/${tenderId}`,
          {
            method: "POST",

            body:
              JSON.stringify({
                amount:
                  numericAmount,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.detail ||
          "No se pudo registrar el pago"
        );

        return;

      }


      setPaymentResult(
        data
      );


      setPaymentAmount("");


      setSuccess(
        "Pago registrado correctamente"
      );


      await loadData();


    } catch {

      setError(
        "No se pudo conectar con el servidor"
      );


    } finally {

      setActionLoading(false);

    }

  }


  // =======================================================
  // LOGOUT
  // =======================================================

  function logout() {

    localStorage.removeItem(
      "access_token"
    );


    router.push("/");

  }


  // =======================================================
  // FORMATEAR FECHA
  // =======================================================

  function formatDate(
    value: string
  ) {

    return new Date(
      value
    ).toLocaleString();

  }


  // =======================================================
  // ESTILO DE ESTADOS
  // =======================================================

  function getStatusStyle(
    status: string
  ) {

    switch (status) {

      case "borrador":

        return (
          "bg-zinc-100 text-zinc-700"
        );


      case "activa":

        return (
          "bg-blue-100 text-blue-700"
        );


      case "finalizada":

        return (
          "bg-purple-100 text-purple-700"
        );


      case "por_cobrar":

        return (
          "bg-yellow-100 text-yellow-800"
        );


      case "cobrada":

        return (
          "bg-green-100 text-green-700"
        );


      case "perdida":

        return (
          "bg-red-100 text-red-700"
        );


      default:

        return (
          "bg-zinc-100 text-zinc-700"
        );

    }

  }


  // =======================================================
  // CARGANDO
  // =======================================================

  if (loading) {

    return (
      <main className="min-h-screen bg-zinc-100 flex items-center justify-center">

        <p className="text-zinc-500">
          Cargando licitación...
        </p>

      </main>
    );

  }


  // =======================================================
  // NO ENCONTRADA
  // =======================================================

  if (!tender) {

    return (
      <main className="min-h-screen bg-zinc-100 flex items-center justify-center">

        <div className="bg-white rounded-xl border border-zinc-200 p-8">

          <p className="text-red-700">
            {error ||
              "No se encontró la licitación"}
          </p>


          <Link
            href="/tenders"
            className="inline-block mt-5 text-sm font-medium text-zinc-900 underline"
          >
            Volver a licitaciones
          </Link>

        </div>

      </main>
    );

  }


  // =======================================================
  // INTERFAZ
  // =======================================================

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
              Detalle de licitación #{tender.id}
            </p>

          </div>


          <div className="flex items-center gap-3">

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


        {/* MENSAJES */}
        {error && (

          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

        )}


        {success && (

          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>

        )}


        {/* INFORMACIÓN PRINCIPAL */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

            <div>

              <div className="flex items-center gap-3">

                <h2 className="text-2xl font-bold text-zinc-900">
                  {tender.title}
                </h2>


                <span
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-sm
                    font-medium
                    ${getStatusStyle(
                      tender.status
                    )}
                  `}
                >
                  {tender.status}
                </span>

              </div>


              {tender.description && (

                <p className="text-zinc-500 mt-3">
                  {tender.description}
                </p>

              )}

            </div>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">


            {/* CLIENTE */}
            <div>

              <p className="text-sm text-zinc-500">
                Cliente
              </p>

              <p className="font-medium text-zinc-900 mt-1">
                {tender.client.name}
              </p>

              <p className="text-sm text-zinc-500">
                {tender.client.company}
              </p>

            </div>


            {/* PRESUPUESTO */}
            <div>

              <p className="text-sm text-zinc-500">
                Presupuesto
              </p>

              <p className="font-medium text-zinc-900 mt-1">
                $
                {Number(
                  tender.budget
                ).toFixed(2)}
              </p>

            </div>


            {/* FECHA */}
            <div>

              <p className="text-sm text-zinc-500">
                Fecha límite
              </p>

              <p className="font-medium text-zinc-900 mt-1">
                {formatDate(
                  tender.deadline
                )}
              </p>

            </div>


            {/* PROPUESTA */}
            <div>

              <p className="text-sm text-zinc-500">
                Propuesta
              </p>


              {tender.proposal_url ? (

                <a
                  href={
                    tender.proposal_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 font-medium text-blue-600 hover:underline"
                >
                  Abrir PDF
                </a>

              ) : (

                <p className="font-medium text-zinc-400 mt-1">
                  Sin propuesta
                </p>

              )}

            </div>

          </div>

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">


          {/* =================================================
              PRODUCTOS
          ================================================= */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200">

            <div className="p-6 border-b border-zinc-200">

              <h3 className="text-lg font-semibold text-zinc-900">
                Productos asociados
              </h3>

            </div>


            {tender.products.length === 0 ? (

              <div className="p-6 text-zinc-500">
                Esta licitación todavía no tiene productos.
              </div>

            ) : (

              <div className="divide-y divide-zinc-200">

                {tender.products.map(
                  (product) => (

                    <div
                      key={product.id}
                      className="p-6 flex items-center justify-between gap-4"
                    >

                      <div>

                        <p className="font-medium text-zinc-900">
                          {product.name}
                        </p>


                        {product.description && (

                          <p className="text-sm text-zinc-500 mt-1">
                            {product.description}
                          </p>

                        )}


                        <div className="mt-3 space-y-1">

                          <p className="text-sm text-zinc-500">

                            Cantidad:{" "}

                            <span className="font-medium text-zinc-900">
                              {product.quantity}
                            </span>

                          </p>


                          <p className="text-sm text-zinc-500">

                            Precio unitario:{" "}

                            <span className="font-medium text-zinc-900">

                              $
                              {Number(
                                product.price
                              ).toFixed(2)}

                            </span>

                          </p>


                          <p className="text-sm text-zinc-500">

                            Subtotal:{" "}

                            <span className="font-semibold text-zinc-900">

                              $
                              {(
                                Number(
                                  product.quantity
                                ) *
                                Number(
                                  product.price
                                )
                              ).toFixed(2)}

                            </span>

                          </p>

                        </div>

                      </div>


                      {tender.status ===
                        "borrador" && (

                        <button
                          onClick={() =>
                            removeProduct(
                              product.id
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Quitar
                        </button>

                      )}

                    </div>

                  )
                )}

              </div>

            )}


            {/* AGREGAR PRODUCTO */}
            {tender.status ===
              "borrador" && (

              <div className="p-6 border-t border-zinc-200">

                <h4 className="font-semibold text-zinc-900">
                  Agregar producto
                </h4>


                <form
                  onSubmit={addProduct}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4"
                >

                  <select
                    required
                    value={
                      selectedProductId
                    }
                    onChange={(event) =>
                      handleProductChange(
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 bg-white"
                  >

                    <option value="">
                      Producto
                    </option>


                    {allProducts.map(
                      (product) => (

                        <option
                          key={
                            product.id
                          }
                          value={
                            product.id
                          }
                        >
                          {product.name}
                        </option>

                      )
                    )}

                  </select>


                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        event.target.value
                      )
                    }
                    placeholder="Cantidad"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  />


                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(
                        event.target.value
                      )
                    }
                    placeholder="Precio"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  />


                  <button
                    type="submit"
                    disabled={
                      actionLoading
                    }
                    className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Agregar
                  </button>

                </form>

              </div>

            )}

          </div>


          {/* =================================================
              ACCIONES
          ================================================= */}
          <div className="space-y-6">


            {/* BORRADOR */}
            {tender.status ===
              "borrador" && (

              <>


                {/* SUBIR PROPUESTA */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">

                  <h3 className="font-semibold text-zinc-900">
                    Documento de propuesta
                  </h3>


                  <p className="text-sm text-zinc-500 mt-2">
                    Selecciona un archivo PDF desde tu computadora.
                  </p>


                  <form
                    onSubmit={
                      uploadProposal
                    }
                    className="mt-4 space-y-4"
                  >


                    {/* INPUT OCULTO */}
                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(event) => {

                        const file =
                          event.target
                            .files?.[0] ||
                          null;


                        setProposalFile(
                          file
                        );

                      }}
                    />


                    {/* BOTÓN QUE ABRE EL EXPLORADOR */}
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef
                          .current
                          ?.click()
                      }
                      disabled={
                        actionLoading
                      }
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Seleccionar PDF
                    </button>


                    {/* NOMBRE DEL ARCHIVO */}
                    {proposalFile && (

                      <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">

                        <p className="font-medium text-zinc-900">
                          Archivo seleccionado:
                        </p>


                        <p className="mt-1 break-all">
                          {proposalFile.name}
                        </p>


                        <p className="mt-1 text-xs text-zinc-500">

                          Tamaño:{" "}

                          {(
                            proposalFile.size /
                            1024 /
                            1024
                          ).toFixed(2)}

                          {" "}MB

                        </p>

                      </div>

                    )}


                    {/* SUBIR */}
                    <button
                      type="submit"
                      disabled={
                        actionLoading ||
                        !proposalFile
                      }
                      className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >

                      {actionLoading
                        ? "Subiendo..."
                        : "Subir PDF"}

                    </button>

                  </form>

                </div>


                {/* ENVIAR */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">

                  <h3 className="font-semibold text-zinc-900">
                    Enviar licitación
                  </h3>


                  <p className="text-sm text-zinc-500 mt-2">
                    Se enviará un correo real al cliente con el documento adjunto.
                  </p>


                  <button
                    onClick={
                      sendTender
                    }
                    disabled={
                      actionLoading
                    }
                    className="w-full mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Enviar al cliente
                  </button>

                </div>

              </>

            )}


            {/* ACTIVA */}
            {tender.status ===
              "activa" && (

              <div className="bg-white rounded-xl border border-zinc-200 p-6">

                <h3 className="font-semibold text-zinc-900">
                  Resolver licitación
                </h3>


                <p className="text-sm text-zinc-500 mt-2">
                  Indica el resultado de la licitación.
                </p>


                <div className="space-y-3 mt-4">

                  <button
                    onClick={() =>
                      changeStatus(
                        "finalizada"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Marcar finalizada
                  </button>


                  <button
                    onClick={() =>
                      changeStatus(
                        "perdida"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="w-full rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Marcar perdida
                  </button>

                </div>

              </div>

            )}


            {/* FINALIZADA */}
            {tender.status ===
              "finalizada" && (

              <div className="bg-white rounded-xl border border-zinc-200 p-6">

                <h3 className="font-semibold text-zinc-900">
                  Facturación
                </h3>


                <p className="text-sm text-zinc-500 mt-2">
                  La licitación fue ganada y completada.
                </p>


                <button
                  onClick={() =>
                    changeStatus(
                      "por_cobrar"
                    )
                  }
                  disabled={
                    actionLoading
                  }
                  className="w-full mt-4 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  Pasar a por cobrar
                </button>

              </div>

            )}


            {/* POR COBRAR */}
            {tender.status ===
              "por_cobrar" && (

              <div className="bg-white rounded-xl border border-zinc-200 p-6">

                <h3 className="font-semibold text-zinc-900">
                  Registrar pago
                </h3>


                <form
                  onSubmit={
                    registerPayment
                  }
                  className="space-y-4 mt-4"
                >

                  <div>

                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Monto
                    </label>


                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={
                        paymentAmount
                      }
                      onChange={(event) =>
                        setPaymentAmount(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                    />

                  </div>


                  <button
                    type="submit"
                    disabled={
                      actionLoading
                    }
                    className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Registrar pago
                  </button>

                </form>


                {paymentResult && (

                  <div className="mt-5 rounded-lg bg-zinc-50 p-4 text-sm">

                    <p>

                      Total facturado:{" "}

                      <strong>
                        $
                        {Number(
                          paymentResult
                            .total_facturado
                        ).toFixed(2)}
                      </strong>

                    </p>


                    <p className="mt-1">

                      Total pagado:{" "}

                      <strong>
                        $
                        {Number(
                          paymentResult
                            .total_pagado
                        ).toFixed(2)}
                      </strong>

                    </p>


                    <p className="mt-1">

                      Saldo pendiente:{" "}

                      <strong>
                        $
                        {Number(
                          paymentResult
                            .saldo_pendiente
                        ).toFixed(2)}
                      </strong>

                    </p>

                  </div>

                )}

              </div>

            )}


            {/* ESTADO FINAL */}
            {(tender.status ===
              "cobrada" ||
              tender.status ===
                "perdida") && (

              <div className="bg-white rounded-xl border border-zinc-200 p-6">

                <h3 className="font-semibold text-zinc-900">
                  Proceso finalizado
                </h3>


                <p className="text-sm text-zinc-500 mt-2">

                  Esta licitación se encuentra en estado{" "}

                  <strong>
                    {tender.status}
                  </strong>

                  .

                </p>

              </div>

            )}

          </div>

        </div>


        {/* =================================================
            HISTORIAL
        ================================================= */}
        <div className="bg-white rounded-xl border border-zinc-200 mt-8">

          <div className="p-6 border-b border-zinc-200">

            <h3 className="text-lg font-semibold text-zinc-900">
              Historial de estados
            </h3>

          </div>


          {tender.history.length === 0 ? (

            <div className="p-6 text-zinc-500">
              Todavía no hay cambios de estado.
            </div>

          ) : (

            <div className="divide-y divide-zinc-200">

              {tender.history.map(
                (history) => (

                  <div
                    key={history.id}
                    className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >


                    <div className="flex items-center gap-3">

                      <span className="font-medium text-zinc-700">
                        {history.old_status}
                      </span>


                      <span className="text-zinc-400">
                        →
                      </span>


                      <span className="font-medium text-zinc-900">
                        {history.new_status}
                      </span>

                    </div>


                    <div className="text-sm text-zinc-500 md:text-right">

                      <p className="font-medium text-zinc-700">

                        {history.user_email ||
                          "Sistema"}

                      </p>


                      <p className="mt-1">

                        {formatDate(
                          history.created_at
                        )}

                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}