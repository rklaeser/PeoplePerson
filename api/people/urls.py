from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, views_auth

router = DefaultRouter()
router.register(r'people', views.PersonViewSet, basename='person')
router.register(r'groups', views.GroupViewSet, basename='group')
router.register(r'history', views.HistoryViewSet, basename='history')
router.register(r'person-associations', views.PersonAssociationViewSet, basename='person-association')
router.register(r'group-associations', views.GroupAssociationViewSet, basename='group-association')

urlpatterns = [
    path('', include(router.urls)),
    # Auth endpoints
    path('auth/verify/', views_auth.verify_token, name='auth-verify'),
    path('auth/me/', views_auth.current_user, name='auth-me'),
    path('auth/status/', views_auth.auth_status, name='auth-status'),
    path('auth/dev/', views_auth.dev_auth, name='auth-dev'),
]