import os

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler

from database import SessionLocal

import models

from services.email_service import send_email


APP_TIMEZONE = ZoneInfo(
    os.getenv(
        "APP_TIMEZONE",
        "America/Panama"
    )
)


scheduler = BackgroundScheduler(
    timezone=APP_TIMEZONE
)


def get_current_time():

    return datetime.now(
        APP_TIMEZONE
    ).replace(
        tzinfo=None
    )


def check_tenders():

    print("Revisando licitaciones...")

    db = SessionLocal()

    try:

        now = get_current_time()


        active_tenders = db.query(
            models.Tender
        ).filter(
            models.Tender.status == "activa"
        ).all()


        for tender in active_tenders:

            try:

                if not tender.deadline:
                    continue


                # ---------------------------------
                # LICITACIÓN VENCIDA
                # ---------------------------------

                if tender.deadline <= now:

                    old_status = tender.status

                    tender.status = "perdida"


                    history = models.StatusHistory(
                        tender_id=tender.id,
                        old_status=old_status,
                        new_status="perdida",
                        user_id=None
                    )


                    db.add(history)

                    db.commit()


                    print(
                        f"Licitación {tender.id} "
                        f"marcada automáticamente como perdida"
                    )


                    continue


                # ---------------------------------
                # RECORDATORIO 48 HORAS
                # ---------------------------------

                time_remaining = (
                    tender.deadline - now
                )


                if time_remaining <= timedelta(
                    hours=48
                ):

                    existing_reminder = (
                        db.query(
                            models.TenderReminder
                        )
                        .filter(
                            models.TenderReminder.tender_id
                            == tender.id
                        )
                        .first()
                    )


                    if existing_reminder:
                        continue


                    message = f"""
                    Recordatorio de licitación.

                    <br><br>

                    La licitación
                    <b>{tender.title}</b>
                    se encuentra próxima a vencer.

                    <br><br>

                    <b>Fecha límite:</b>
                    {tender.deadline}

                    <br>

                    <b>Presupuesto:</b>
                    ${tender.budget}
                    """


                    send_email(
                        tender.client.email,
                        "Recordatorio de licitación",
                        message,
                        tender.proposal_url
                    )


                    reminder = models.TenderReminder(
                        tender_id=tender.id
                    )


                    db.add(reminder)

                    db.commit()


                    print(
                        f"Recordatorio enviado "
                        f"para licitación {tender.id}"
                    )


            except Exception as error:

                db.rollback()

                print(
                    f"Error procesando licitación "
                    f"{tender.id}: {error}"
                )


    finally:

        db.close()



def start_scheduler():

    scheduler.add_job(
        check_tenders,
        trigger="interval",
        minutes=1,
        id="check_tenders_job",
        replace_existing=True
    )


    scheduler.start()

    print(
        "Scheduler de licitaciones iniciado"
    )



def stop_scheduler():

    if scheduler.running:

        scheduler.shutdown(
            wait=False
        )