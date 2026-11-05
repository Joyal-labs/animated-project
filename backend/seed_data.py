"""
Data Seeding Script for Rolex Concierge Backend
Populates official jeweller boutique locations and consultation purposes.
Run via: python seed_data.py
"""

import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from enquiries.models import JewellerLocation, ConsultationPurpose, Enquiry

def seed():

    print("Beginning Rolex boutique and consultation purpose seeding...")

    boutiques = [
        {
            "name": "Geneva — Rue du Rhône Flagship",
            "address": "40 Rue du Rhône",
            "city": "Geneva",
            "country": "Switzerland",
            "phone": "+41 22 310 12 34",
            "email": "geneve@rolex-boutique.com",
            "is_active": True
        },
        {
            "name": "London — New Bond Street Boutique",
            "address": "43-44 New Bond Street",
            "city": "London",
            "country": "United Kingdom",
            "phone": "+44 20 7493 2299",
            "email": "bondstreet@rolex-boutique.com",
            "is_active": True
        },
        {
            "name": "Mumbai — The Taj Mahal Palace",
            "address": "Apollo Bunder, Colaba",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "phone": "+91 22 6665 3366",
            "email": "mumbai.taj@rolex-boutique.com",
            "is_active": True
        },
        {
            "name": "New Delhi — The Chanakya",
            "address": "Tikka Kannan, Chanakyapuri",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "phone": "+91 11 2611 1199",
            "email": "delhi.chanakya@rolex-boutique.com",
            "is_active": True
        },
        {
            "name": "Bengaluru — UB City",
            "address": "24 Vittal Mallya Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
            "phone": "+91 80 4173 8899",
            "email": "bengaluru.ub@rolex-boutique.com",
            "is_active": True
        },
        {
            "name": "Dubai — The Dubai Mall",
            "address": "Fashion Avenue, Ground Floor",
            "city": "Dubai",
            "country": "United Arab Emirates",
            "phone": "+971 4 339 8999",
            "email": "dubaimall@rolex-boutique.com",
            "is_active": True
        },
        {
            "name": "New York — Fifth Avenue",
            "address": "665 Fifth Avenue",
            "city": "New York",
            "state": "NY",
            "country": "United States",
            "phone": "+1 212 758 7700",
            "email": "fifthave@rolex-boutique.com",
            "is_active": True
        },
        {
            "name": "Singapore — Marina Bay Sands",
            "address": "10 Bayfront Avenue, #01-20",
            "city": "Singapore",
            "country": "Singapore",
            "phone": "+65 6688 7788",
            "email": "mbs@rolex-boutique.com",
            "is_active": True
        }
    ]

    for b in boutiques:
        loc, created = JewellerLocation.objects.update_or_create(
            name=b["name"],
            defaults=b
        )
        status_text = "Created" if created else "Updated"
        print(f"[{status_text}] Boutique: {loc.name}")

    purposes = [
        {
            "name": "Private Salon Viewing",
            "description": "Dedicated VIP appointment in a private boutique salon to view and inspect Reference 126688.",
            "is_active": True
        },
        {
            "name": "Acquisition Reservation",
            "description": "Formal allocation and client dossier preparation for purchasing the 18 ct yellow gold Yacht-Master II.",
            "is_active": True
        },
        {
            "name": "Technical Horological Presentation",
            "description": "In-depth walkthrough of Calibre 4161, regatta countdown memory programming, and Ring Command bezel interaction.",
            "is_active": True
        },
        {
            "name": "Bespoke Fitting & Sizing",
            "description": "Tailored bracelet fitting with 5 mm Easylink comfort extension and link adjustment by certified Rolex watchmakers.",
            "is_active": True
        }
    ]

    for p in purposes:
        purp, created = ConsultationPurpose.objects.update_or_create(
            name=p["name"],
            defaults=p
        )
        status_text = "Created" if created else "Updated"
        print(f"[{status_text}] Purpose: {purp.name}")

    print("\n[SUCCESS] Seeding completed successfully!")

if __name__ == '__main__':
    seed()
