from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Assumes the model has a 'user' field.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        # Handle FirebaseUser case by comparing user IDs
        if hasattr(request.user, '_user_obj'):
            # FirebaseUser - compare with the underlying Django User object
            return obj.user == request.user._user_obj
        else:
            # Regular Django User
            return obj.user == request.user


class IsAuthenticatedOrInternalService(permissions.BasePermission):
    """
    Allow access to authenticated users or internal services with X-User-ID header
    """
    
    def has_permission(self, request, view):
        # Allow internal service requests with X-User-ID header
        if request.META.get('HTTP_X_USER_ID'):
            return True
        
        # Otherwise require authentication
        return request.user and request.user.is_authenticated