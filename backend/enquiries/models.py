from django.db import models


class JewellerLocation(models.Model):
    """
    Official Rolex Jeweller / Authorized Retailer Boutique Location.
    Manageable from Django Admin.
    """
    name = models.CharField(max_length=255, unique=True, help_text="Boutique or Retailer Name")
    address = models.CharField(max_length=255, blank=True, help_text="Street address")
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100)
    phone = models.CharField(max_length=50, blank=True, help_text="Direct concierge phone line")
    email = models.EmailField(blank=True, help_text="Boutique concierge email")
    is_active = models.BooleanField(default=True, db_index=True, help_text="Active in public enquiry form")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Official Jeweller Location"
        verbose_name_plural = "Official Jeweller Locations"
        ordering = ['city', 'name']

    def __str__(self):
        return f"{self.name} ({self.city}, {self.country})"


class ConsultationPurpose(models.Model):
    """
    Consultation Purpose / Appointment Objective.
    Manageable from Django Admin.
    """
    name = models.CharField(max_length=255, unique=True, help_text="e.g. Private Salon Viewing")
    description = models.TextField(blank=True, help_text="Details of what this consultation includes")
    is_active = models.BooleanField(default=True, db_index=True, help_text="Active in public enquiry form")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Consultation Purpose"
        verbose_name_plural = "Consultation Purposes"
        ordering = ['name']

    def __str__(self):
        return self.name


class Enquiry(models.Model):
    """
    Private Boutique Consultation Enquiry for Yacht-Master II and Rolex collections.
    """
    STATUS_NEW = 'New'
    STATUS_CONTACTED = 'Contacted'
    STATUS_SCHEDULED = 'Appointment Scheduled'
    STATUS_COMPLETED = 'Completed'
    STATUS_CANCELLED = 'Cancelled'

    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_CONTACTED, 'Contacted'),
        (STATUS_SCHEDULED, 'Appointment Scheduled'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    full_name = models.CharField(max_length=255, verbose_name="Full Name")
    email = models.EmailField(verbose_name="Email Address")
    phone_whatsapp = models.CharField(max_length=50, verbose_name="Phone / WhatsApp")
    jeweller_location = models.ForeignKey(
        JewellerLocation,
        on_delete=models.PROTECT,
        related_name='enquiries',
        verbose_name="Official Jeweller Location"
    )
    consultation_purpose = models.ForeignKey(
        ConsultationPurpose,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enquiries',
        verbose_name="Consultation Purpose"
    )
    preferred_date = models.DateField(null=True, blank=True, verbose_name="Preferred Date")
    special_requests = models.TextField(blank=True, verbose_name="Special Requests / Notes")
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_NEW,
        db_index=True,
        verbose_name="Enquiry Status"
    )
    internal_notes = models.TextField(
        blank=True,
        verbose_name="Internal Concierge Notes",
        help_text="Private notes for boutique staff only (not visible to client)"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = "Private Consultation Enquiry"
        verbose_name_plural = "Private Consultation Enquiries"
        ordering = ['-created_at']

    def __str__(self):
        return f"Enquiry #{self.id} — {self.full_name} ({self.status})"
