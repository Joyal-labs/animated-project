from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints
    path('jeweller-locations/', views.JewellerLocationListView.as_view(), name='jeweller-locations-list'),
    path('consultation-purposes/', views.ConsultationPurposeListView.as_view(), name='consultation-purposes-list'),
    
    # Dual-purpose collection endpoint (POST public, GET staff/admin)
    path('enquiries/', views.EnquiryCollectionEndpoint.as_view(), name='enquiries-collection'),
    
    # Detail endpoint (GET, PATCH, DELETE staff/admin only)
    path('enquiries/<int:pk>/', views.EnquiryDetailAdminView.as_view(), name='enquiries-detail'),
]
