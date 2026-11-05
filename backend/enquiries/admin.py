import csv
from datetime import date
from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html
from django.urls import path
from django.template.response import TemplateResponse
from django.db.models import Count

from .models import JewellerLocation, ConsultationPurpose, Enquiry


@admin.register(JewellerLocation)
class JewellerLocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'city', 'country', 'phone', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'country', 'city']
    search_fields = ['name', 'city', 'country', 'address', 'phone', 'email']
    list_editable = ['is_active']
    ordering = ['city', 'name']


@admin.register(ConsultationPurpose)
class ConsultationPurposeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    list_editable = ['is_active']
    ordering = ['name']


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'full_name',
        'email',
        'phone_whatsapp',
        'jeweller_location',
        'consultation_purpose',
        'preferred_date',
        'status_badge',
        'created_at',
    ]
    list_filter = [
        'status',
        'jeweller_location',
        'consultation_purpose',
        'preferred_date',
        'created_at',
    ]
    search_fields = [
        'full_name',
        'email',
        'phone_whatsapp',
        'special_requests',
        'internal_notes',
    ]
    list_per_page = 25
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
    actions = ['export_as_csv', 'mark_contacted', 'mark_scheduled', 'mark_completed']

    fieldsets = (
        ("Client Information", {
            'fields': (('id', 'status'), 'full_name', 'email', 'phone_whatsapp')
        }),
        ("Consultation Specifications", {
            'fields': ('jeweller_location', 'consultation_purpose', 'preferred_date', 'special_requests')
        }),
        ("Concierge Internal Management", {
            'fields': ('internal_notes', ('created_at', 'updated_at'))
        }),
    )

    def status_badge(self, obj):
        colors = {
            Enquiry.STATUS_NEW: '#D4AF37',          # Rolex Metallic Gold
            Enquiry.STATUS_CONTACTED: '#60A5FA',    # Light Blue
            Enquiry.STATUS_SCHEDULED: '#34D399',    # Emerald Green
            Enquiry.STATUS_COMPLETED: '#9CA3AF',    # Platinum Gray
            Enquiry.STATUS_CANCELLED: '#F87171',    # Soft Coral Red
        }
        bg = colors.get(obj.status, '#E5E7EB')
        return format_html(
            '<span style="background-color: {}; color: #0A0A0A; padding: 4px 10px; '
            'border-radius: 3px; font-weight: 700; font-size: 11px; '
            'letter-spacing: 0.5px; display: inline-block;">{}</span>',
            bg, obj.status
        )
    status_badge.short_description = "Status"
    status_badge.admin_order_field = 'status'

    @admin.action(description="Export selected enquiries to CSV")
    def export_as_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="rolex_concierge_enquiries.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'ID',
            'Full Name',
            'Email',
            'Phone / WhatsApp',
            'Jeweller Location',
            'Consultation Purpose',
            'Preferred Date',
            'Status',
            'Special Requests',
            'Internal Notes',
            'Created At',
            'Updated At',
        ])
        for item in queryset:
            writer.writerow([
                item.id,
                item.full_name,
                item.email,
                item.phone_whatsapp,
                item.jeweller_location.name if item.jeweller_location else '',
                item.consultation_purpose.name if item.consultation_purpose else '',
                item.preferred_date.strftime('%Y-%m-%d') if item.preferred_date else '',
                item.status,
                item.special_requests,
                item.internal_notes,
                item.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                item.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])
        return response

    @admin.action(description="Mark selected as Contacted")
    def mark_contacted(self, request, queryset):
        updated = queryset.update(status=Enquiry.STATUS_CONTACTED)
        self.message_user(request, f"{updated} enquiries marked as Contacted.")

    @admin.action(description="Mark selected as Appointment Scheduled")
    def mark_scheduled(self, request, queryset):
        updated = queryset.update(status=Enquiry.STATUS_SCHEDULED)
        self.message_user(request, f"{updated} enquiries marked as Appointment Scheduled.")

    @admin.action(description="Mark selected as Completed")
    def mark_completed(self, request, queryset):
        updated = queryset.update(status=Enquiry.STATUS_COMPLETED)
        self.message_user(request, f"{updated} enquiries marked as Completed.")

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('analytics-dashboard/', self.admin_site.admin_view(self.analytics_dashboard_view), name='enquiries-analytics-dashboard'),
        ]
        return custom_urls + urls

    def analytics_dashboard_view(self, request):
        """Dedicated Luxury Analytics & Summary Dashboard View."""
        today = date.today()
        
        total_enquiries = Enquiry.objects.count()
        new_enquiries = Enquiry.objects.filter(status=Enquiry.STATUS_NEW).count()
        contacted_enquiries = Enquiry.objects.filter(status=Enquiry.STATUS_CONTACTED).count()
        scheduled_enquiries = Enquiry.objects.filter(status=Enquiry.STATUS_SCHEDULED).count()
        completed_enquiries = Enquiry.objects.filter(status=Enquiry.STATUS_COMPLETED).count()
        cancelled_enquiries = Enquiry.objects.filter(status=Enquiry.STATUS_CANCELLED).count()
        
        today_enquiries = Enquiry.objects.filter(created_at__date=today).count()
        
        upcoming_appointments = Enquiry.objects.filter(
            preferred_date__gte=today
        ).exclude(
            status=Enquiry.STATUS_CANCELLED
        ).order_by('preferred_date')[:8]
        
        recent_enquiries = Enquiry.objects.select_related(
            'jeweller_location', 'consultation_purpose'
        ).order_by('-created_at')[:8]
        
        location_breakdown = JewellerLocation.objects.annotate(
            enquiry_count=Count('enquiries')
        ).filter(enquiry_count__gt=0).order_by('-enquiry_count')
        
        purpose_breakdown = ConsultationPurpose.objects.annotate(
            enquiry_count=Count('enquiries')
        ).filter(enquiry_count__gt=0).order_by('-enquiry_count')

        context = {
            **self.admin_site.each_context(request),
            'title': 'Rolex Concierge — Boutique Performance & Analytics Dashboard',
            'total_enquiries': total_enquiries,
            'new_enquiries': new_enquiries,
            'contacted_enquiries': contacted_enquiries,
            'scheduled_enquiries': scheduled_enquiries,
            'completed_enquiries': completed_enquiries,
            'cancelled_enquiries': cancelled_enquiries,
            'today_enquiries': today_enquiries,
            'upcoming_appointments': upcoming_appointments,
            'recent_enquiries': recent_enquiries,
            'location_breakdown': location_breakdown,
            'purpose_breakdown': purpose_breakdown,
        }
        return TemplateResponse(request, 'admin/enquiries/dashboard.html', context)
