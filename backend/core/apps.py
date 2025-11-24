from django.apps import AppConfig
from django.db.utils import OperationalError, ProgrammingError


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        try:
            from core.models import Contractor

            if Contractor.objects.count() == 0:
                Contractor.objects.create(
                    name="Kitchen Expert GmbH",
                    address="Berger strasse 123",
                    city="Frankfurt am Main",       
                    postal_code="60486",
                    state="Hessen",                
                    phone="1234567890",
                    website="",
                    email="test@gmail.com", # create a temporary email for testing 

                    price_range="medium",
                    service_area="Frankfurt am Main",
                    business_size="small",
                    years_in_business=10,

                    services="Kitchen renovation",
                    description="Auto-created contractor for testing Invite flow.",
                    specializations="Kitchen Renovation",

                    rating=4.7,
                    reviews_count=52,

                    certifications="",
                    kfw_eligible=False,
                    source="auto",
                    additional_info="",

                    # MUST MATCH selectedProject.project_type EXACTLY
                    project_types="kitchen_renovation"
                )
                print("✓ Auto contractor created (Kitchen Expert GmbH)")
        except (OperationalError, ProgrammingError):
            pass


