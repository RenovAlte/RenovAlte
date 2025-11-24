import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from core.api.serializers import OfferRequestCreateSerializer
from core.models import Contractor

logger = logging.getLogger(__name__)

@api_view(["POST"])
def invite_contractors(request):
    """
    Frontend sends:
    {
        "user": 1,
        "project": 2,
        "contractor_ids": [5, 7],
        "subject": "...",
        "body": "..."
    }
    """
    logger.info("=== INVITE CONTRACTORS ENDPOINT HIT ===")
    logger.info(f"Request data: {request.data}")

    user_id = request.data.get("user")
    project_id = request.data.get("project")
    contractor_ids = request.data.get("contractor_ids", [])

    # NEW — read subject + body from frontend
    subject = request.data.get("subject", "Invitation to submit an offer")
    body = request.data.get("body", "")

    logger.info(f"User ID: {user_id}, Project ID: {project_id}, Contractor IDs: {contractor_ids}")

    if not contractor_ids:
        logger.warning("No contractors selected")
        return Response({"error": "No contractors selected"}, status=400)

    created_requests = []

    for contractor_id in contractor_ids:
        logger.info(f"Processing contractor ID: {contractor_id}")
        
        data = {
            "user": user_id,
            "project": project_id,
            "contractor": contractor_id,
            "status": "pending"
        }

        serializer = OfferRequestCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        offer_request = serializer.save()

        contractor = Contractor.objects.get(id=contractor_id)
        invite_link = f"{settings.FRONTEND_URL}/offer/submit/{offer_request.token}"

        logger.info(f"Sending email to: {contractor.email}")

        # NEW — final email body combines frontend text + link
        final_message = f"""
{body}

Submit your offer here:
{invite_link}

Thank you,
RenovAlte Team
"""

        try:
            send_mail(
                subject=subject,
                message=final_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[contractor.email],
                fail_silently=False,
            )
            logger.info(f"Email sent successfully to {contractor.email}")
        except Exception as e:
            logger.error(f"Email sending failed for {contractor.email}: {str(e)}", exc_info=True)
            return Response({"error": f"Failed to send email: {str(e)}"}, status=500)

        created_requests.append(serializer.data)

    logger.info("=== ALL INVITATIONS SENT SUCCESSFULLY ===")
    return Response(
        {"message": "Invitations sent successfully!", "created": created_requests},
        status=status.HTTP_201_CREATED
    )
