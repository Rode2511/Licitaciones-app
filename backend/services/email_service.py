import os
import base64
import requests
import resend

from dotenv import load_dotenv


load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")


def send_email(
    to_email: str,
    subject: str,
    message: str,
    attachment_path: str = None
):

    params = {
        "from": "onboarding@resend.dev",
        "to": [to_email],
        "subject": subject,
        "html": f"""
        <h2>Licitaciones App</h2>
        <p>{message}</p>
        """
    }


    if attachment_path:

        # Si el archivo está en Supabase
        if attachment_path.startswith("http"):

            response = requests.get(
                attachment_path,
                timeout=30
            )

            response.raise_for_status()

            file_content = response.content

            filename = attachment_path.split("/")[-1]


        # Compatibilidad con archivos locales anteriores
        else:

            with open(attachment_path, "rb") as file:
                file_content = file.read()

            filename = os.path.basename(
                attachment_path
            )


        file_base64 = base64.b64encode(
            file_content
        ).decode("utf-8")


        params["attachments"] = [
            {
                "filename": filename,
                "content": file_base64
            }
        ]


    response = resend.Emails.send(params)

    return response