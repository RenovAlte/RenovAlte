from django.db import models
import secrets


class OfferRequest(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    contractor = models.ForeignKey('core.Contractor', on_delete=models.CASCADE)
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE)

    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('offered', 'Offered')],
        default='pending'
    )

    token = models.CharField(max_length=64, unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)
