from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from core.api.serializers import OfferRequestCreateSerializer
from core.models import OfferRequest, Contractor
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(["POST"])
def invite_contractors(request):
    """
    Expected POST JSON:
    {
        "user": 1,
        "project": 2,
        "contractor_ids": [4, 5, 6]
    }
    """
    user_id = request.data.get("user")
    project_id = request.data.get("project")
    contractor_ids = request.data.get("contractor_ids", [])

    if not contractor_ids:
        return Response({"error": "No contractors selected"}, status=400)

    created_requests = []

    for contractor_id in contractor_ids:
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

        # ---- SEND EMAIL ----
        send_mail(
            subject="You have been invited to submit an offer",
            message=f"""
Hello {contractor.full_name},

You have been invited to submit an offer for project ID {project_id}.

Click the link below to submit your offer:
{invite_link}

Best regards,
RenovAlte Team
            """,
            from_email="RenovAlte <no-reply@renovalte.com>",
            recipient_list=[contractor.email],
            fail_silently=False,
        )

        created_requests.append(serializer.data)

    return Response(
        {"message": "Invitations sent", "created": created_requests},
        status=status.HTTP_201_CREATED
    )
