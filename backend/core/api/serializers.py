from rest_framework import serializers
from core.models import OfferRequest


class OfferRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferRequest
        fields = ["user", "contractor", "project", "status"]

    def create(self, validated_data):
        offer_request = OfferRequest.objects.create(**validated_data)
        return offer_request
