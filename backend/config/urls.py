"""
URL configuration for Rolex Concierge backend project.
"""

from django.contrib import admin
from django.urls import path, include

# Configure Admin header & title to reflect Rolex Concierge branding
admin.site.site_header = "ROLEX CONCIERGE — BOUTIQUE MANAGEMENT"
admin.site.site_title = "Rolex Boutique Admin"
admin.site.index_title = "Private Consultation Enquiries & Locations"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('enquiries.urls')),
]
