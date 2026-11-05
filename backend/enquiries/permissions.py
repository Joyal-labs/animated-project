from rest_framework import permissions


class IsStaffOrAdminUser(permissions.BasePermission):
    """
    Allows access only to authenticated staff or superuser accounts.
    Public users are completely denied from accessing private client enquiry data.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )
