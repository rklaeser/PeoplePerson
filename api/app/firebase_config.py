import firebase_admin
from firebase_admin import credentials, auth
import os
from typing import Optional

# Firebase configuration using the same project as the frontend
FIREBASE_PROJECT_ID = "peopleperson-d189e"

# Global Firebase app instance
_firebase_app: Optional[firebase_admin.App] = None

def initialize_firebase():
    """
    Initialize Firebase Admin SDK
    Uses Application Default Credentials in production or service account key
    """
    global _firebase_app
    
    if _firebase_app is not None:
        return _firebase_app
    
    try:
        # Check if we have a service account key file path
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        
        if service_account_path and os.path.exists(service_account_path):
            # Use service account key file
            cred = credentials.Certificate(service_account_path)
            _firebase_app = firebase_admin.initialize_app(cred, {
                'projectId': FIREBASE_PROJECT_ID
            })
            print(f"Firebase initialized with service account: {service_account_path}")
        else:
            # Use Application Default Credentials or project ID only
            # This works in Google Cloud environments or with gcloud auth
            _firebase_app = firebase_admin.initialize_app(options={
                'projectId': FIREBASE_PROJECT_ID
            })
            print(f"Firebase initialized with project ID: {FIREBASE_PROJECT_ID}")
            
    except ValueError as e:
        if "already exists" in str(e):
            # Firebase app already initialized
            _firebase_app = firebase_admin.get_app()
            print("Firebase app already initialized")
        else:
            raise e
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        raise e
    
    return _firebase_app

def get_firebase_app() -> firebase_admin.App:
    """Get the Firebase app instance, initializing if necessary"""
    if _firebase_app is None:
        return initialize_firebase()
    return _firebase_app

def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return user information
    
    Args:
        id_token: Firebase ID token from client
        
    Returns:
        dict: User information from verified token
        
    Raises:
        firebase_admin.auth.InvalidIdTokenError: If token is invalid
        firebase_admin.auth.ExpiredIdTokenError: If token is expired
        firebase_admin.auth.RevokedIdTokenError: If token is revoked
    """
    app = get_firebase_app()
    
    # Verify the ID token
    decoded_token = auth.verify_id_token(id_token, app=app)
    
    # Extract user information
    user_info = {
        "id": decoded_token["uid"],
        "email": decoded_token.get("email"),
        "name": decoded_token.get("name", decoded_token.get("email", "Unknown")),
        "email_verified": decoded_token.get("email_verified", False)
    }
    
    return user_info