from datetime import date, timedelta
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import JewellerLocation, ConsultationPurpose, Enquiry


class RolexEnquiriesAPITests(TestCase):
    """
    Comprehensive test suite for Rolex Concierge Enquiries API,
    validation logic, staff permissions, and admin operations.
    """

    def setUp(self):
        self.client = APIClient()

        # Create active test jeweller locations
        self.geneva_location = JewellerLocation.objects.create(
            name="Geneva — Rue du Rhône Flagship",
            city="Geneva",
            country="Switzerland",
            is_active=True
        )
        self.inactive_location = JewellerLocation.objects.create(
            name="Closed Boutique",
            city="Atlantis",
            country="Unknown",
            is_active=False
        )

        # Create active test consultation purposes
        self.viewing_purpose = ConsultationPurpose.objects.create(
            name="Private Salon Viewing",
            description="VIP private viewing of Yacht-Master II Ref 126688",
            is_active=True
        )
        self.inactive_purpose = ConsultationPurpose.objects.create(
            name="Discontinued Service",
            description="Inactive purpose",
            is_active=False
        )

        # Create staff user for admin-protected endpoints
        self.admin_user = User.objects.create_superuser(
            username='boutique_manager',
            email='manager@rolex-boutique.com',
            password='RolexLuxuryPassword2026!'
        )

        self.enquiry_url = reverse('enquiries-collection')

    def test_database_creation_and_defaults(self):
        """Verify model ORM creation, default status 'New', and foreign key linkage."""
        enquiry = Enquiry.objects.create(
            full_name="Lord Sterling",
            email="sterling@luxury.co.uk",
            phone_whatsapp="+44 20 7946 0958",
            jeweller_location=self.geneva_location,
            consultation_purpose=self.viewing_purpose,
            special_requests="Requesting champagne upon arrival."
        )
        self.assertEqual(enquiry.status, Enquiry.STATUS_NEW)
        self.assertIsNotNone(enquiry.created_at)
        self.assertIsNotNone(enquiry.updated_at)
        self.assertEqual(enquiry.jeweller_location.name, "Geneva — Rue du Rhône Flagship")

    def test_valid_enquiry_submission(self):
        """Verify valid enquiry returns 201 and exact response format."""
        tomorrow = (date.today() + timedelta(days=2)).isoformat()
        payload = {
            "full_name": "Alistair Vance",
            "email": "alistair.vance@geneva-capital.ch",
            "phone_whatsapp": "+41 22 765 4321",
            "jeweller_location": self.geneva_location.id,
            "consultation_purpose": self.viewing_purpose.id,
            "preferred_date": tomorrow,
            "special_requests": "Interested in 18 ct yellow gold Yacht-Master II 126688."
        }

        response = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get("success"))
        self.assertEqual(
            response.data.get("message"),
            "Your private appointment request has been submitted successfully."
        )
        self.assertIn("enquiry_id", response.data)

        # Verify record in database
        enquiry = Enquiry.objects.get(id=response.data["enquiry_id"])
        self.assertEqual(enquiry.full_name, "Alistair Vance")
        self.assertEqual(enquiry.status, Enquiry.STATUS_NEW)

    def test_missing_required_fields(self):
        """Verify validation failure when required fields (name, email, phone, location) are missing."""
        payload = {
            "special_requests": "Missing required fields"
        }
        response = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get("success"))
        errors = response.data.get("errors", {})
        self.assertIn("full_name", errors)
        self.assertIn("email", errors)
        self.assertIn("phone_whatsapp", errors)
        self.assertIn("jeweller_location", errors)

    def test_invalid_email(self):
        """Verify validation fails when email format is invalid."""
        payload = {
            "full_name": "Marcus Aurelius",
            "email": "not-an-email",
            "phone_whatsapp": "+1 212 555 0199",
            "jeweller_location": self.geneva_location.id
        }
        response = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get("success"))
        self.assertIn("email", response.data.get("errors", {}))

    def test_invalid_phone(self):
        """Verify validation fails when phone number has invalid formatting."""
        payload = {
            "full_name": "Marcus Aurelius",
            "email": "marcus@rome.it",
            "phone_whatsapp": "invalid_phone_text",
            "jeweller_location": self.geneva_location.id
        }
        response = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get("success"))
        self.assertIn("phone_whatsapp", response.data.get("errors", {}))

    def test_invalid_jeweller_location(self):
        """Verify error when selecting non-existent or inactive jeweller location."""
        # Non-existent
        payload = {
            "full_name": "John Doe",
            "email": "john@doe.com",
            "phone_whatsapp": "+1 555 123 4567",
            "jeweller_location": 99999
        }
        response = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("jeweller_location", response.data.get("errors", {}))

        # Inactive location
        payload["jeweller_location"] = self.inactive_location.id
        response_inactive = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response_inactive.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("jeweller_location", response_inactive.data.get("errors", {}))

    def test_invalid_consultation_purpose(self):
        """Verify error when selecting inactive or non-existent consultation purpose."""
        payload = {
            "full_name": "John Doe",
            "email": "john@doe.com",
            "phone_whatsapp": "+1 555 123 4567",
            "jeweller_location": self.geneva_location.id,
            "consultation_purpose": self.inactive_purpose.id
        }
        response = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("consultation_purpose", response.data.get("errors", {}))

    def test_past_preferred_date(self):
        """Verify validation fails when preferred date is in the past."""
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        payload = {
            "full_name": "John Doe",
            "email": "john@doe.com",
            "phone_whatsapp": "+1 555 123 4567",
            "jeweller_location": self.geneva_location.id,
            "preferred_date": yesterday
        }
        response = self.client.post(self.enquiry_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("preferred_date", response.data.get("errors", {}))

    def test_unauthenticated_enquiry_listing_fails(self):
        """Public/unauthenticated users must NOT be allowed to retrieve enquiries."""
        response = self.client.get(self.enquiry_url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_authenticated_admin_enquiry_listing(self):
        """Authenticated staff/admin user can view enquiries list."""
        Enquiry.objects.create(
            full_name="Lady Eleanor",
            email="eleanor@mayfair.co.uk",
            phone_whatsapp="+44 20 7123 4567",
            jeweller_location=self.geneva_location
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.enquiry_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return list of enquiries
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertGreaterEqual(len(results), 1)

    def test_status_update(self):
        """Staff/Admin can update enquiry status and add internal notes."""
        enquiry = Enquiry.objects.create(
            full_name="Sir Arthur",
            email="arthur@kensington.co.uk",
            phone_whatsapp="+44 20 8987 6543",
            jeweller_location=self.geneva_location
        )
        detail_url = reverse('enquiries-detail', kwargs={'pk': enquiry.id})
        
        self.client.force_authenticate(user=self.admin_user)
        patch_payload = {
            "status": Enquiry.STATUS_SCHEDULED,
            "internal_notes": "VIP client allocated Salon Privé on Friday at 3 PM."
        }
        response = self.client.patch(detail_url, patch_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        enquiry.refresh_from_db()
        self.assertEqual(enquiry.status, Enquiry.STATUS_SCHEDULED)
        self.assertEqual(enquiry.internal_notes, patch_payload["internal_notes"])
