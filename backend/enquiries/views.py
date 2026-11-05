from rest_framework import status, generics, filters
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import exception_handler
from rest_framework.throttling import AnonRateThrottle

from .models import JewellerLocation, ConsultationPurpose, Enquiry
from .serializers import (
    JewellerLocationSerializer,
    ConsultationPurposeSerializer,
    EnquiryCreateSerializer,
    EnquiryDetailSerializer,
)
from .permissions import IsStaffOrAdminUser
from .emails import send_enquiry_notifications


def custom_exception_handler(exc, context):
    """
    Custom exception handler to guarantee the required JSON error format:
    {
        "success": false,
        "errors": {
            "field": ["error message"]
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'success': False,
        }

        # If data is a dictionary of field errors (e.g. from serializer validation)
        if isinstance(response.data, dict):
            if 'detail' in response.data and len(response.data) == 1:
                custom_data['detail'] = response.data['detail']
            else:
                custom_data['errors'] = response.data
        elif isinstance(response.data, list):
            custom_data['errors'] = {'non_field_errors': response.data}
        else:
            custom_data['errors'] = {'error': str(response.data)}

        response.data = custom_data

    return response


class JewellerLocationListView(generics.ListAPIView):
    """
    GET /api/jeweller-locations/
    Public endpoint: Lists active official Rolex boutique locations for the dropdown.
    """
    permission_classes = [AllowAny]
    serializer_class = JewellerLocationSerializer
    pagination_class = None

    def get_queryset(self):
        return JewellerLocation.objects.filter(is_active=True).order_by('city', 'name')


class ConsultationPurposeListView(generics.ListAPIView):
    """
    GET /api/consultation-purposes/
    Public endpoint: Lists active consultation purposes for the dropdown.
    """
    permission_classes = [AllowAny]
    serializer_class = ConsultationPurposeSerializer
    pagination_class = None

    def get_queryset(self):
        return ConsultationPurpose.objects.filter(is_active=True).order_by('name')


class EnquiryCollectionEndpoint(generics.ListCreateAPIView):
    """
    Endpoint for /api/enquiries/
    - POST: Publicly accessible to submit an enquiry. Rate-limited.
    - GET: Staff/Admin only to retrieve all enquiries with filtering/search.
    """
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'phone_whatsapp', 'special_requests', 'internal_notes']
    ordering_fields = ['created_at', 'preferred_date', 'status']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsStaffOrAdminUser()]

    def get_throttles(self):
        if self.request.method == 'POST':
            return [AnonRateThrottle()]
        return []

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EnquiryCreateSerializer
        return EnquiryDetailSerializer

    def get_queryset(self):
        queryset = Enquiry.objects.select_related('jeweller_location', 'consultation_purpose').all()
        
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        location_param = self.request.query_params.get('location')
        if location_param:
            queryset = queryset.filter(jeweller_location_id=location_param)
            
        purpose_param = self.request.query_params.get('purpose')
        if purpose_param:
            queryset = queryset.filter(consultation_purpose_id=purpose_param)
            
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            enquiry = serializer.save()

            # Dispatch staff alert and optional customer confirmation email
            send_enquiry_notifications(enquiry)

            return Response(
                {
                    "success": True,
                    "message": "Your private appointment request has been submitted successfully.",
                    "enquiry_id": enquiry.id,
                },
                status=status.HTTP_201_CREATED,
            )
        
        return Response(
            {
                "success": False,
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class EnquiryDetailAdminView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/enquiries/<id>/
    PATCH  /api/enquiries/<id>/
    DELETE /api/enquiries/<id>/
    Staff/Admin only: Retrieve, update status/notes, or delete a private enquiry.
    """
    permission_classes = [IsStaffOrAdminUser]
    serializer_class = EnquiryDetailSerializer
    queryset = Enquiry.objects.select_related('jeweller_location', 'consultation_purpose').all()
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        enquiry_id = instance.id
        instance.delete()
        return Response(
            {
                "success": True,
                "message": f"Enquiry #{enquiry_id} was successfully deleted.",
            },
            status=status.HTTP_200_OK,
        )
