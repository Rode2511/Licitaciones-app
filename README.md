# Sistema de Gestión de Licitaciones

Aplicación full-stack para la gestión de licitaciones comerciales.

El sistema permite administrar clientes, productos, usuarios y licitaciones, adjuntar propuestas en PDF, enviar correos transaccionales reales, gestionar el ciclo de estados de una licitación, registrar pagos y ejecutar tareas automáticas para recordatorios y vencimientos.

---

## Aplicación desplegada

### Frontend

https://licitaciones-70kn2h1ee-rode-s-project.vercel.app

### Backend API

https://licitaciones-api-0vpj.onrender.com

### Swagger / OpenAPI

https://licitaciones-api-0vpj.onrender.com/docs

### Repositorio

https://github.com/Rode2511/Licitaciones-app

---

## Tecnologías utilizadas

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel

### Backend

- Python
- FastAPI
- SQLAlchemy
- JWT
- Passlib / bcrypt
- APScheduler
- Uvicorn
- Render

### Base de datos

- PostgreSQL
- Docker para desarrollo local
- Supabase PostgreSQL para producción

### Servicios externos

- Supabase Storage para almacenamiento de propuestas PDF
- Resend para correo transaccional con archivos adjuntos
- cron-job.org para ejecución periódica del job en producción

---

# Arquitectura

La aplicación utiliza frontend y backend separados.

```text
                    Usuario
                       |
                       v
                Next.js / Vercel
                       |
                       | HTTPS / REST
                       v
                FastAPI / Render
                  /      |       \
                 /       |        \
                v        v         v
        PostgreSQL   Supabase    Resend
         Supabase     Storage     Email
                                  |
                                  v
                               Cliente


cron-job.org
     |
     | POST /jobs/check-tenders
     v
FastAPI / Render
     |
     v
Recordatorios y vencimientos
```

En desarrollo local, PostgreSQL se ejecuta mediante Docker.

---

# Funcionalidades

## Autenticación y usuarios

- Login mediante correo y contraseña.
- Autenticación mediante JWT.
- Roles:
  - `admin`
  - `user`
- Solo los administradores pueden crear nuevos usuarios.
- Pantalla de administración de usuarios disponible únicamente para administradores.
- Creación automática del administrador inicial mediante variables de entorno.

---

## Clientes

- Crear clientes.
- Listar clientes.
- Correo único por cliente.
- Validación de clientes duplicados.
- Auditoría de creación y modificación.

---

## Productos

- Crear productos.
- Listar productos.
- Precio base por producto.
- Auditoría de creación y modificación.

---

## Licitaciones

Cada licitación pertenece a un cliente y puede contener múltiples productos.

Los productos se manejan mediante una relación N:M que almacena:

- Producto.
- Cantidad.
- Precio específico utilizado en la licitación.

El sistema permite:

- Crear una licitación en estado `borrador`.
- Listar licitaciones.
- Consultar el detalle de una licitación.
- Agregar productos.
- Quitar productos.
- Validar que no existan productos repetidos.
- Validar el presupuesto máximo.
- Subir una propuesta PDF.
- Abrir el documento mediante una URL real de Supabase.
- Enviar la licitación al cliente.
- Consultar historial de estados.

---

# Estados de una licitación

El flujo implementado es:

```text
borrador
   |
   | enviar propuesta
   v
activa
  / \
 /   \
v     v
finalizada   perdida
    |
    v
por_cobrar
    |
    | saldo = 0
    v
cobrada
```

Las transiciones permitidas son:

```text
borrador    -> activa
activa      -> finalizada
activa      -> perdida
finalizada  -> por_cobrar
por_cobrar  -> cobrada
```

Cualquier transición diferente es rechazada por la API.

`borrador -> activa` solamente puede realizarse mediante el endpoint de envío de la licitación y requiere una propuesta PDF previamente cargada.

`por_cobrar -> cobrada` se realiza automáticamente cuando el saldo pendiente llega a cero.

---

# Reglas de negocio implementadas

## Presupuesto

El total de los productos asociados se calcula mediante:

```text
total = Σ cantidad × precio
```

Si el total supera el presupuesto máximo de la licitación, la operación es rechazada.

---

## Modificación de productos

Los productos solamente pueden agregarse o eliminarse mientras la licitación se encuentra en estado editable.

Una vez enviada y procesada, la aplicación bloquea estas modificaciones.

---

## Documento de propuesta

Antes de enviar una licitación se debe cargar una propuesta en formato PDF.

Los archivos son almacenados en:

```text
Supabase Storage
```

y la aplicación guarda una URL real del documento.

---

## Envío de licitación

Al enviar una licitación:

1. Se valida que exista una propuesta PDF.
2. Se valida que tenga productos.
3. Se verifica que el total de productos no supere el presupuesto.
4. La licitación pasa de `borrador` a `activa`.
5. Se registra la transición en el historial.
6. Se envía un correo real al cliente mediante Resend.
7. El correo incluye:
   - productos;
   - cantidades;
   - precios;
   - presupuesto;
   - fecha límite;
   - documento PDF adjunto.

---

# Recordatorios y vencimiento automático

La aplicación incluye lógica basada en tiempo.

## Recordatorio

Si una licitación:

```text
estado = activa
```

y faltan menos de:

```text
48 horas
```

para su fecha límite, se envía automáticamente un correo de recordatorio.

La tabla:

```text
tender_reminders
```

evita enviar múltiples recordatorios para la misma licitación.

---

## Vencimiento automático

Si una licitación permanece:

```text
activa
```

después de superar su fecha límite, el sistema realiza automáticamente:

```text
activa -> perdida
```

y registra la transición en el historial como una acción del sistema.

---

## Ejecución programada

Durante desarrollo local se utiliza APScheduler.

En producción existe además un endpoint protegido:

```text
POST /jobs/check-tenders
```

que es ejecutado periódicamente mediante cron-job.org.

El endpoint requiere:

```text
X-Cron-Secret
```

para evitar ejecuciones no autorizadas.

Esto permite que la lógica de recordatorios y vencimientos funcione también en el ambiente desplegado.

---

# Pagos

Los pagos solamente pueden registrarse cuando una licitación se encuentra en:

```text
por_cobrar
```

El saldo se calcula mediante:

```text
saldo pendiente =
total facturado - suma de pagos
```

El sistema:

- rechaza pagos negativos o iguales a cero;
- rechaza pagos superiores al saldo pendiente;
- permite pagos parciales;
- registra cada pago;
- actualiza el saldo;
- cambia automáticamente la licitación a `cobrada` cuando el saldo llega a cero.

---

# Historial de estados

Cada transición almacena:

- estado anterior;
- estado nuevo;
- usuario;
- fecha y hora.

Ejemplo:

```text
borrador -> activa
admin@email.com

activa -> finalizada
admin@email.com

finalizada -> por_cobrar
admin@email.com

por_cobrar -> cobrada
admin@email.com
```

Cuando la transición ocurre automáticamente:

```text
activa -> perdida
Sistema
```

---

# Auditoría

Las principales entidades incluyen información de auditoría:

```text
created_at
updated_at
created_by
updated_by
```

Esto permite identificar quién creó o modificó los registros y cuándo ocurrió.

---

# API

La documentación interactiva está disponible en:

https://licitaciones-api-0vpj.onrender.com/docs

## Autenticación

```http
POST /auth/login
```

---

## Usuarios

```http
GET  /users/
POST /users/
```

Solo administradores pueden acceder a estas operaciones.

---

## Clientes

```http
GET  /clients/
POST /clients/
```

---

## Productos

```http
GET  /products/
POST /products/
```

---

## Licitaciones

```http
GET  /tenders/
POST /tenders/

GET /tenders/{tender_id}

POST   /tenders/{tender_id}/products
DELETE /tenders/{tender_id}/products/{product_id}

POST /tenders/{tender_id}/proposal

POST /tenders/{tender_id}/send

PATCH /tenders/{tender_id}/status
```

---

## Pagos

```http
POST /payments/{tender_id}
```

---

## Job programado

```http
POST /jobs/check-tenders
```

Requiere el header:

```text
X-Cron-Secret
```

---

# Estructura del proyecto

```text
licitaciones-app/
│
├── backend/
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── clients.py
│   │   ├── jobs.py
│   │   ├── payments.py
│   │   ├── products.py
│   │   ├── tenders.py
│   │   └── users.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── bootstrap_service.py
│   │   ├── email_service.py
│   │   ├── file_service.py
│   │   ├── scheduler_service.py
│   │   └── tender_service.py
│   │
│   ├── database.py
│   ├── dependencies.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   │
│   ├── app/
│   │   ├── clients/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── tenders/
│   │   ├── users/
│   │   └── page.tsx
│   │
│   ├── lib/
│   │   └── api.ts
│   │
│   └── .env.example
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Instalación local

## Requisitos

Para ejecutar el proyecto localmente se necesita:

- Python 3
- Node.js y npm
- Docker Desktop
- Git

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/Rode2511/Licitaciones-app.git

cd Licitaciones-app
```

---

# Base de datos local

El proyecto incluye PostgreSQL mediante Docker.

Desde la raíz:

```bash
docker compose up -d
```

Esto inicia PostgreSQL localmente.

Para verificar los contenedores:

```bash
docker ps
```

---

# Backend

Entrar a:

```bash
cd backend
```

Crear un entorno virtual:

### Windows

```powershell
python -m venv venv

.\venv\Scripts\Activate.ps1
```

### Linux / macOS

```bash
python3 -m venv venv

source venv/bin/activate
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

---

## Variables de entorno del backend

Copiar:

```text
backend/.env.example
```

como:

```text
backend/.env
```

Configurar:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/licitaciones

SECRET_KEY=una_clave_segura

ACCESS_TOKEN_EXPIRE_MINUTES=120

FRONTEND_URL=http://localhost:3000

APP_TIMEZONE=America/Panama

RESEND_API_KEY=tu_resend_api_key

SUPABASE_URL=https://tu-proyecto.supabase.co

SUPABASE_SECRET_KEY=tu_supabase_secret_key

ADMIN_EMAIL=admin@ejemplo.com

ADMIN_PASSWORD=contraseña_del_admin

CRON_SECRET=clave_para_el_cron
```

Las claves reales no se encuentran versionadas en el repositorio.

---

## Ejecutar FastAPI

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# Frontend

Desde la raíz:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Crear:

```text
frontend/.env.local
```

con:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Ejecutar:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

---

# Build del frontend

Para comprobar el build de producción:

```bash
npm run build
```

---

# Configuración de producción

## Frontend

Desplegado en Vercel.

Variable principal:

```env
NEXT_PUBLIC_API_URL=https://licitaciones-api-0vpj.onrender.com
```

---

## Backend

Desplegado en Render.

Comando de instalación:

```bash
pip install -r requirements.txt
```

Comando de inicio:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## PostgreSQL

En producción se utiliza PostgreSQL alojado en Supabase.

La conexión se configura mediante:

```env
DATABASE_URL
```

---

## Almacenamiento

Los documentos PDF se almacenan en Supabase Storage.

Bucket utilizado:

```text
propuestas
```

---

## Email

El envío de correos transaccionales se realiza mediante Resend.

Para pruebas con la configuración de desarrollo de Resend puede ser necesario utilizar un correo habilitado por la cuenta utilizada para el despliegue.

---

# Credenciales para evaluación

Por seguridad, no deben publicarse las credenciales personales ni las claves utilizadas para infraestructura.

Se recomienda crear un usuario independiente exclusivamente para evaluación.

```text
Email: REEMPLAZAR_CON_USUARIO_DEMO
Password: REEMPLAZAR_CON_PASSWORD_DEMO
```


---

# Evidencias

## Correo real con documento adjunto

La aplicación fue probada enviando una licitación real mediante Resend con el documento de propuesta adjunto.


---

## Deployment de la página web

Se utilizó la versión gratuita de la pagina de Vercel para la subida de la aplicación y su uso online.

## Eventos en render

Se utilizó render de forma gratuita para el almacenamiento del backend.


## Propuesta en supabase

Se utilizó una base de datos gratuita en supabase para almacenar los PDF de las licitaciones.

# Seguridad

- Contraseñas almacenadas mediante hash bcrypt.
- Autenticación JWT.
- Endpoints protegidos mediante Bearer Token.
- Control de acceso por roles.
- Solo administradores pueden crear usuarios.
- Variables sensibles almacenadas mediante variables de entorno.
- Archivos `.env` excluidos del repositorio mediante `.gitignore`.
- Endpoint del cron protegido mediante `X-Cron-Secret`.

---

# Pruebas realizadas

Se validaron los siguientes escenarios:

- Login correcto e incorrecto.
- Restricción de creación de usuarios por rol.
- Creación y listado de clientes.
- Validación de correos duplicados.
- Creación y listado de productos.
- Creación de licitaciones.
- Asociación de productos N:M.
- Validación de presupuesto máximo.
- Prevención de productos duplicados.
- Carga de propuestas PDF.
- Apertura del documento desde Supabase.
- Envío real mediante Resend.
- Adjunto PDF recibido por correo.
- Transiciones válidas e inválidas.
- Pagos parciales.
- Prevención de sobrepago.
- Cambio automático a `cobrada`.
- Historial de transiciones.
- Auditoría.
- Recordatorio automático antes del vencimiento.
- Prevención de recordatorios duplicados.
- Cambio automático de `activa` a `perdida` al vencer.
- Ejecución del job en producción.
- Integración frontend-backend desplegada.

---

# Flujo principal

```text
Login
  |
  v
Crear cliente
  |
  v
Crear productos
  |
  v
Crear licitación
  |
  v
Agregar productos
  |
  v
Subir propuesta PDF
  |
  v
Enviar licitación
  |
  v
activa
 /   \
v     v
perdida     finalizada
                |
                v
            por_cobrar
                |
                v
           registrar pagos
                |
                v
             cobrada
```

---

# Autor

Roderick Diaz

Proyecto desarrollado como prueba técnica para una posición de Desarrollador Jr/Mid.