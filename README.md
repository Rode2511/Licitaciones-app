# Sistema de Licitaciones API

API REST para la gestión de licitaciones, clientes, productos, usuarios y pagos.

Desarrollada como prueba técnica utilizando FastAPI y PostgreSQL.

---

## Tecnologías utilizadas

- Python 3
- FastAPI
- SQLAlchemy
- PostgreSQL 16
- Docker
- JWT para autenticación
- Bcrypt para cifrado de contraseñas

---

# Funcionalidades

## Usuarios y autenticación

- Registro de usuarios.
- Inicio de sesión mediante JWT.
- Control de acceso mediante roles.
- Gestión de usuarios por administradores.

Roles disponibles:

- admin
- ejecutivo
- user


## Clientes

- Crear clientes.
- Consultar clientes.


## Productos

- Crear productos.
- Consultar productos.


## Licitaciones

- Crear licitaciones.
- Asociar productos.
- Consultar detalle de una licitación.
- Subir propuestas en formato PDF.
- Enviar licitaciones.
- Control de estados.
- Historial de cambios.


Flujo de estados:
borrador
    |
    v
activa
    |
    v
finalizada
    |
    v
por_cobrar
    |
    v
cobrada


## Pagos

- Registrar pagos.
- Actualizar estado de licitación a cobrada.
- Registrar historial.


## Correos

- Envío de notificación al enviar una licitación.

---

# Estructura del proyecto

backend/

├── routers/
│   ├── auth.py
│   ├── users.py
│   ├── clients.py
│   ├── products.py
│   ├── tenders.py
│   └── payments.py
│
├── services/
│   ├── auth_service.py
│   ├── tender_service.py
│   ├── email_service.py
│   └── file_service.py
│
├── models.py
├── schemas.py
├── database.py
├── dependencies.py
└── main.py


---

# Instalación

## 1. Clonar el proyecto

git clone <url-del-repositorio>


## 2. Crear entorno virtual

Desde la carpeta backend:

python -m venv venv


Activar entorno virtual:

Windows:

venv\\Scripts\\activate


## 3. Instalar dependencias

pip install -r requirements.txt


---

# Configuración de base de datos

La aplicación utiliza PostgreSQL mediante Docker.

Levantar la base de datos:

docker compose up -d


Configuración utilizada:

Database: licitaciones
User: admin
Password: password
Port: 5432


---

# Variables de entorno

Crear un archivo .env dentro de backend:

DATABASE_URL=postgresql://admin:password@localhost:5432/licitaciones

SECRET_KEY=clave_secreta

RESEND_API_KEY=api_key_correo


---

# Ejecutar la aplicación

Desde la carpeta backend:

uvicorn main:app --reload


La API estará disponible en:

http://127.0.0.1:8000


---

# Documentación API

Swagger:

http://127.0.0.1:8000/docs


Redoc:

http://127.0.0.1:8000/redoc


---

# Flujo de prueba recomendado

1. Registrar usuario.
2. Iniciar sesión y obtener token JWT.
3. Crear cliente.
4. Crear producto.
5. Crear licitación.
6. Asociar productos.
7. Subir propuesta PDF.
8. Enviar licitación.
9. Cambiar estados.
10. Registrar pago.


---

# Mejoras futuras

- Implementar migraciones con Alembic.
- Agregar pruebas automatizadas.
- Usar almacenamiento externo para archivos.
- Agregar paginación en consultas.
"""