import os
import uuid
import shutil
import tempfile

from fastapi import UploadFile
from supabase import create_client, Client
from dotenv import load_dotenv


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

BUCKET_NAME = "propuestas"


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


def save_file(
    file: UploadFile,
    tender_id: int
):

    extension = os.path.splitext(file.filename)[1]

    unique_id = uuid.uuid4().hex

    filename = (
        f"tender_{tender_id}_"
        f"{unique_id}"
        f"{extension}"
    )


    # Crear archivo temporal
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=extension
    ) as temp_file:

        file.file.seek(0)

        shutil.copyfileobj(
            file.file,
            temp_file
        )

        temp_path = temp_file.name


    try:

        # Subir archivo temporal a Supabase
        supabase.storage.from_(
            BUCKET_NAME
        ).upload(
            path=filename,
            file=temp_path,
            file_options={
                "content-type": "application/pdf",
                "upsert": "false"
            }
        )


        # Obtener URL pública
        public_url = (
            supabase.storage
            .from_(BUCKET_NAME)
            .get_public_url(filename)
        )


        return public_url


    finally:

        # Eliminar archivo temporal de la computadora
        if os.path.exists(temp_path):
            os.remove(temp_path)