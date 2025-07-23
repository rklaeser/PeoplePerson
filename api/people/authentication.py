from rest_framework import authentication, exceptions
from django.contrib.auth.models import AnonymousUser
from firebase_admin import auth, credentials, initialize_app
from django.conf import settings
from datetime import datetime
import json
import os


class FirebaseUser:
    """
    A simple user class that mimics Django's User model for Firebase users
    """
    def __init__(self, user_obj):
        """Initialize from a Django User model instance"""
        self.id = str(user_obj.id)  # Database UUID
        self.firebase_uid = user_obj.firebase_uid
        self.email = user_obj.email
        self.name = user_obj.name
        self.is_authenticated = True
        self.is_anonymous = False
        self._user_obj = user_obj  # Keep reference to original model
    
    def __str__(self):
        return self.name or self.email or self.firebase_uid


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Firebase token authentication for Django REST Framework
    """
    
    def __init__(self):
        super().__init__()
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if not already initialized - same logic as seed command"""
        try:
            # Check if Firebase is already initialized
            from firebase_admin import _apps
            if not _apps:
                # Get Firebase config from environment (same as seed command)
                FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
                FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', getattr(settings, 'FIREBASE_PROJECT_ID', 'peopleperson-d189e'))
                
                if FIREBASE_SERVICE_ACCOUNT_PATH:
                    # Use service account file
                    cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
                    initialize_app(cred, options={
                        'projectId': FIREBASE_PROJECT_ID
                    })
                    print('Initialized Firebase Admin SDK with service account')
                else:
                    # For emulator or development - use Application Default Credentials
                    os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "localhost:9099"
                    initialize_app(options={
                        'projectId': FIREBASE_PROJECT_ID
                    })
                    print('Initialized Firebase Admin SDK for emulator')
        except Exception as e:
            print(f"Firebase initialization error: {e}")
    
    def authenticate(self, request):
        """
        Authenticate the request using Firebase ID token and sync user to database
        """
      
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split('Bearer ')[1]
        
        try:
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token.get('uid')
            email = decoded_token.get('email')
            name = decoded_token.get('name')
            email_verified = decoded_token.get('email_verified', False)
            
            # Get or create user in database
            from .models import User
            user, created = User.objects.get_or_create(
                firebase_uid=firebase_uid,
                defaults={
                    'email': email,
                    'name': name,
                    'email_verified': datetime.utcnow() if email_verified else None
                }
            )
            
            # Update user info if changed
            if not created:
                updated = False
                if user.email != email:
                    user.email = email
                    updated = True
                if user.name != name:
                    user.name = name
                    updated = True
                if email_verified and not user.email_verified:
                    user.email_verified = datetime.utcnow()
                    updated = True
                
                if updated:
                    user.save()
            
            return (FirebaseUser(user), None)
            
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid Firebase token: {str(e)}')
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the WWW-Authenticate header in a 401 response
        """
        return 'Bearer'