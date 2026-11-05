import logging
from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def send_enquiry_notifications(enquiry):
    """
    Sends the enquiry details directly to the boutique inbox
    and an optional confirmation email to the client.
    """
    results = {'admin_sent': False, 'customer_sent': False}
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
    admin_recipient = getattr(settings, 'ADMIN_NOTIFICATION_EMAIL', settings.EMAIL_HOST_USER)

    location_name = enquiry.jeweller_location.name if enquiry.jeweller_location else "Not specified"
    purpose_name = enquiry.consultation_purpose.name if enquiry.consultation_purpose else "Private Salon Viewing"
    pref_date = enquiry.preferred_date.strftime("%B %d, %Y") if enquiry.preferred_date else "Flexible / Not specified"

    # 1. Direct inbox notification with client Reply-To
    try:
        admin_subject = f"[ROLEX CONCIERGE] New Appointment Request #{enquiry.id} — {enquiry.full_name}"
        admin_message = f"""ROLEX CONCIERGE PRIVATE BOUTIQUE CONSULTATION REQUEST

A new private boutique appointment enquiry has been received.

REFERENCE ID: RLX-126688-{enquiry.id:04d}
SUBMISSION TIME: {enquiry.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")}

CLIENT DETAILS:
- Full Name: {enquiry.full_name}
- Email: {enquiry.email}
- Phone / WhatsApp: {enquiry.phone_whatsapp}

APPOINTMENT SPECIFICATIONS:
- Watch Reference: Yacht-Master II (Ref. 126688, 18 ct Yellow Gold)
- Boutique Location: {location_name}
- Consultation Purpose: {purpose_name}
- Preferred Date: {pref_date}

SPECIAL REQUESTS / CLIENT NOTES:
{enquiry.special_requests or 'None provided.'}

STATUS: {enquiry.status}

Reply to this email to contact the client directly at {enquiry.email}.
"""
        admin_mail = EmailMessage(
            subject=admin_subject,
            body=admin_message,
            from_email=from_email,
            to=[admin_recipient],
            reply_to=[enquiry.email] if enquiry.email else None,
        )
        admin_mail.send(fail_silently=False)
        results['admin_sent'] = True
        logger.info(f"Staff notification email sent for Enquiry #{enquiry.id} to {admin_recipient}")
    except Exception as e:
        logger.warning(f"Failed to dispatch staff notification email for Enquiry #{enquiry.id}: {e}")

    # 2. Customer Confirmation Email (if enabled in settings)
    if getattr(settings, 'SEND_CUSTOMER_CONFIRMATION', True) and enquiry.email:
        try:
            cust_subject = "Rolex Concierge — Your Private Boutique Consultation Request"
            cust_message = f"""Dear {enquiry.full_name},

Thank you for requesting a private boutique consultation for the Rolex Oyster Perpetual Yacht-Master II (Reference 126688 in 18 ct yellow gold).

Your enquiry has been received and prioritized by our Concierge team.

APPOINTMENT SUMMARY:
- Confirmation Reference: RLX-126688-{enquiry.id:04d}
- Official Jeweller: {location_name}
- Consultation Purpose: {purpose_name}
- Preferred Date: {pref_date}

A dedicated Rolex client advisor from your chosen boutique will contact you within 24 hours to confirm availability and personalize your salon viewing.

Warm regards,

Rolex Concierge Services
Official Jeweller Network
"""
            customer_mail = EmailMessage(
                subject=cust_subject,
                body=cust_message,
                from_email=from_email,
                to=[enquiry.email],
            )
            customer_mail.send(fail_silently=False)
            results['customer_sent'] = True
            logger.info(f"Customer confirmation email sent for Enquiry #{enquiry.id}")
        except Exception as e:
            logger.warning(f"Failed to dispatch customer confirmation email for Enquiry #{enquiry.id}: {e}")

    return results
