from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Person, Group, History, PersonAssociation, GroupAssociation, Entry, EntryPerson
from .serializers import (
    PersonSerializer, PersonCreateSerializer, PersonUpdateSerializer, PersonDetailSerializer,
    GroupSerializer, HistorySerializer, PersonAssociationSerializer, GroupAssociationSerializer,
    EntrySerializer, EntryCreateSerializer, EntryPersonSerializer
)
from .permissions import IsOwnerOrReadOnly, IsAuthenticatedOrInternalService


class PersonViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrInternalService, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'body', 'mnemonic']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']
    
    def get_queryset(self):
        # Allow internal service requests with X-User-ID header
        if hasattr(self.request, 'META') and 'HTTP_X_USER_ID' in self.request.META:
            user_id = self.request.META.get('HTTP_X_USER_ID')
            return Person.objects.filter(user_id=user_id).prefetch_related('groups', 'history_entries')
        
        # Normal authenticated request - use the user ID
        user_id = self.request.user.id
        return Person.objects.filter(user_id=user_id).prefetch_related('groups', 'history_entries')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PersonCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PersonUpdateSerializer
        elif self.action == 'retrieve':
            return PersonDetailSerializer
        return PersonSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('query', '')
        if not query:
            return Response({'detail': 'Query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        people = self.get_queryset().filter(
            Q(name__icontains=query) | Q(body__icontains=query) | Q(mnemonic__icontains=query)
        )
        
        serializer = self.get_serializer(people, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_to_group(self, request, pk=None):
        person = self.get_object()
        group_name = request.data.get('group_name')
        
        if not group_name:
            return Response({'detail': 'group_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = request.user.id
        
        # Get or create group
        group, created = Group.objects.get_or_create(
            name=group_name, 
            user_id=user_id,
            defaults={'description': f'Auto-created group: {group_name}'}
        )
        
        # Add person to group
        association, created = GroupAssociation.objects.get_or_create(
            person=person,
            group=group,
            user_id=user_id
        )
        
        if created:
            return Response({'detail': f'Added {person.name} to {group_name}'})
        else:
            return Response({'detail': f'{person.name} already in {group_name}'})
    
    @action(detail=True, methods=['delete'])
    def remove_from_group(self, request, pk=None):
        person = self.get_object()
        group_id = request.data.get('group_id')
        
        if not group_id:
            return Response({'detail': 'group_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = request.user.id
        
        try:
            association = GroupAssociation.objects.get(
                person=person,
                group_id=group_id,
                user_id=user_id
            )
            group_name = association.group.name
            association.delete()
            return Response({'detail': f'Removed {person.name} from {group_name}'})
        except GroupAssociation.DoesNotExist:
            return Response({'detail': 'Association not found'}, status=status.HTTP_404_NOT_FOUND)


class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        user_id = self.request.user.id
        return Group.objects.filter(user_id=user_id).prefetch_related('people')
    
    @action(detail=True, methods=['get'])
    def people(self, request, pk=None):
        group = self.get_object()
        people = group.people.all()
        serializer = PersonSerializer(people, many=True)
        return Response(serializer.data)


class HistoryViewSet(viewsets.ModelViewSet):
    serializer_class = HistorySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['person', 'change_type', 'field']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user_id = self.request.user.id
        return History.objects.filter(user_id=user_id).select_related('person')


class PersonAssociationViewSet(viewsets.ModelViewSet):
    serializer_class = PersonAssociationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.request.user.id
        return PersonAssociation.objects.filter(
            person__user_id=user_id,
            associate__user_id=user_id
        ).select_related('person', 'associate')


class GroupAssociationViewSet(viewsets.ModelViewSet):
    serializer_class = GroupAssociationSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.user.id
        return GroupAssociation.objects.filter(user_id=user_id).select_related('person', 'group')


class EntryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user_id = self.request.user.id
        return Entry.objects.filter(user_id=user_id).prefetch_related('people')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EntryCreateSerializer
        return EntrySerializer
    
    def create(self, request, *args, **kwargs):
        # Create the entry
        response = super().create(request, *args, **kwargs)
        
        # If successful, trigger async processing
        if response.status_code == 201:
            entry_id = response.data['id']
            
            # Import here to avoid circular imports
            from django.db import transaction
            from .tasks import process_entry_with_langchain
            
            # Queue the task after the transaction commits
            # This ensures the entry is in the database when the worker processes it
            transaction.on_commit(lambda: process_entry_with_langchain.delay(entry_id))
            
        return response
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """
        Process an entry to extract people and assign them to the entry.
        This endpoint will eventually use AI to analyze the content and identify people.
        """
        entry = self.get_object()
        
        # TODO: Implement AI processing to extract people from entry.content
        # For now, this is a placeholder that returns a success message
        
        return Response({
            'detail': 'Entry processing not yet implemented',
            'entry_id': entry.id,
            'content': entry.content
        })
    
    @action(detail=True, methods=['post'])
    def add_person(self, request, pk=None):
        """Add a person to this entry"""
        entry = self.get_object()
        person_id = request.data.get('person_id')
        
        if not person_id:
            return Response({'detail': 'person_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            person = Person.objects.get(id=person_id, user_id=request.user.id)
        except Person.DoesNotExist:
            return Response({'detail': 'Person not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create the association
        association, created = EntryPerson.objects.get_or_create(
            entry=entry,
            person=person
        )
        
        if created:
            return Response({'detail': f'Added {person.name} to entry'})
        else:
            return Response({'detail': f'{person.name} already associated with entry'})
    
    @action(detail=True, methods=['delete'])
    def remove_person(self, request, pk=None):
        """Remove a person from this entry"""
        entry = self.get_object()
        person_id = request.data.get('person_id')
        
        if not person_id:
            return Response({'detail': 'person_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            association = EntryPerson.objects.get(
                entry=entry,
                person_id=person_id
            )
            person_name = association.person.name
            association.delete()
            return Response({'detail': f'Removed {person_name} from entry'})
        except EntryPerson.DoesNotExist:
            return Response({'detail': 'Person not associated with this entry'}, status=status.HTTP_404_NOT_FOUND)
