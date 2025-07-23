from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer
import os


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    """
    Verify Firebase token and return user info.
    This endpoint is called by FastAPI to verify tokens and get user data.
    
    The FirebaseAuthentication class handles token verification and user sync,
    so if we reach this point, the user is already authenticated and synced.
    """
    user = request.user
    return Response({
        'id': user.id,
        'firebase_uid': user.firebase_uid,
        'name': user.name,
        'email': user.email,
        'email_verified': user.email_verified is not None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current authenticated user info
    """
    user = request.user
    if hasattr(user, '_user_obj'):
        # If using FirebaseUser wrapper, get the actual model
        serializer = UserSerializer(user._user_obj)
    else:
        # Direct user model
        serializer = UserSerializer(user)
    
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def auth_status(request):
    """
    Check authentication status (for debugging)
    """
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user_id': request.user.id,
            'environment': os.getenv('ENVIRONMENT', 'production')
        })
    else:
        return Response({
            'authenticated': False,
            'environment': os.getenv('ENVIRONMENT', 'production')
        })



@api_view(['POST'])
@permission_classes([AllowAny])
def dev_auth(request):
    """
    Development-only endpoint to get auth token for demo user
    """
    if os.getenv('ENVIRONMENT') != 'development':
        return Response(
            {'error': 'This endpoint is only available in development'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Return demo user info that FastAPI can use
    return Response({
        'id': '00000000-0000-0000-0000-000000000001',
        'firebase_uid': 'demo-firebase-uid',
        'name': 'Dwight Schrute',
        'email': 'dwight@schrutefarms.com',
        'token': 'dev-token-not-for-production'
    })