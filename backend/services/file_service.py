import os
import shutil
from fastapi import UploadFile


UPLOAD_FOLDER = "uploads"


def save_file(
    file: UploadFile,
    tender_id: int
):

    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)


    filename = f"tender_{tender_id}_{file.filename}"

    path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )


    with open(path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    return path