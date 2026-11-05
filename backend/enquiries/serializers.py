import re
from datetime import date
from rest_framework import serializers
from .models import JewellerLocation, ConsultationPurpose, Enquiry


class JewellerLocationSerializer(serializers.ModelSerializer):
    """Serializer for active official jeweller locations (public dropdown)."""
    class Meta:
        model = JewellerLocation
        fields = [
            'id',
            'name',
            'address',
            'city',
            'state',
            'country',
            'phone',
            'email',
            'is_active',
        ]


class ConsultationPurposeSerializer(serializers.ModelSerializer):
    """Serializer for active consultation purposes (public dropdown)."""
    class Meta:
        model = ConsultationPurpose
        fields = [
            'id',
            'name',
            'description',
            'is_active',
        ]


class EnquiryCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for public enquiry submission (POST /api/enquiries/).
    Validates required fields, formats, and active foreign key relations.
    """
    jeweller_location = serializers.PrimaryKeyRelatedField(
        queryset=JewellerLocation.objects.all(),
        required=True,
        error_messages={
            'required': 'Please select an official jeweller location.',
            'does_not_exist': 'The selected jeweller location does not exist.',
            'incorrect_type': 'Invalid jeweller location identifier.',
        }
    )
    consultation_purpose = serializers.PrimaryKeyRelatedField(
        queryset=ConsultationPurpose.objects.all(),
        required=False,
        allow_null=True,
        error_messages={
            'does_not_exist': 'The selected consultation purpose does not exist.',
            'incorrect_type': 'Invalid consultation purpose identifier.',
        }
    )

    class Meta:
        model = Enquiry
        fields = [
            'id',
            'full_name',
            'email',
            'phone_whatsapp',
            'jeweller_location',
            'consultation_purpose',
            'preferred_date',
            'special_requests',
        ]
        read_only_fields = ['id']

    def validate_full_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Full name must contain at least 2 characters.")
        return name

    def validate_email(self, value):
        email = value.strip().lower()
        if not email:
            raise serializers.ValidationError("Email address is required.")
        return email

    def validate_phone_whatsapp(self, value):
        phone = value.strip()
        if not phone:
            raise serializers.ValidationError("Phone / WhatsApp number is required.")
        
        # Regex allowing international formats: +91 98765 43210, (123) 456-7890, etc.
        phone_pattern = re.compile(r'^\+?[0-9\s\-\(\)\.]{7,25}$')
        if not phone_pattern.match(phone):
            raise serializers.ValidationError(
                "Enter a valid phone or WhatsApp number (e.g. +91 98765 43210 or +41 22 310 12 34)."
            )
        return phone

    def validate_jeweller_location(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "The selected jeweller location is currently inactive or not accepting consultations."
            )
        return value

    def validate_consultation_purpose(self, value):
        if value is not None and not value.is_active:
            raise serializers.ValidationError(
                "The selected consultation purpose is currently unavailable."
            )
        return value

    def validate_preferred_date(self, value):
        if value:
            today = date.today()
            if value < today:
                raise serializers.ValidationError(
                    "Preferred consultation date cannot be in the past."
                )
        return value

    def create(self, validated_data):
        # Enforce initial status 'New' upon creation
        validated_data['status'] = Enquiry.STATUS_NEW
        return super().create(validated_data)


class EnquiryDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for staff enquiry review and management.
    """
    jeweller_location = JewellerLocationSerializer(read_only=True)
    consultation_purpose = ConsultationPurposeSerializer(read_only=True)
    jeweller_location_id = serializers.PrimaryKeyRelatedField(
        queryset=JewellerLocation.objects.all(),
        source='jeweller_location',
        write_only=True,
        required=False
    )
    consultation_purpose_id = serializers.PrimaryKeyRelatedField(
        queryset=ConsultationPurpose.objects.all(),
        source='consultation_purpose',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Enquiry
        fields = [
            'id',
            'full_name',
            'email',
            'phone_whatsapp',
            'jeweller_location',
            'jeweller_location_id',
            'consultation_purpose',
            'consultation_purpose_id',
            'preferred_date',
            'special_requests',
            'status',
            'internal_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
