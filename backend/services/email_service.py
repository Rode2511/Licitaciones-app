import os
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

        with open(attachment_path, "rb") as file:
            file_content = file.read()

        params["attachments"] = [
            {
                "filename": os.path.basename(attachment_path),
                "content": file_content
            }
        ]


    response = resend.Emails.send(params)

    return response