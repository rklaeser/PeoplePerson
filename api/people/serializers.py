from rest_framework import serializers
from .models import Person, Group, History, User, PersonAssociation, GroupAssociation, Entry, EntryPerson


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'firebase_uid', 'name', 'email', 'email_verified', 'image', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PersonSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    
    class Meta:
        model = Person
        fields = [
            'id', 'name', 'body', 'intent', 'birthday', 'mnemonic', 
            'zip', 'profile_pic_index', 'user_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Set user from context (will be provided by the view)
        user = self.context['request'].user
        if hasattr(user, '_user_obj'):
            validated_data['user'] = user._user_obj
        else:
            from .models import User
            validated_data['user'] = User.objects.get(id=user.id)
        return super().create(validated_data)


class PersonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['name', 'body', 'intent', 'birthday', 'mnemonic', 'zip']


class PersonUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['name', 'body', 'intent', 'birthday', 'mnemonic', 'zip']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make all fields optional for updates
        for field in self.fields.values():
            field.required = False


class GroupSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    people_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'user_id', 'people_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_people_count(self, obj):
        return obj.people.count()

    def create(self, validated_data):
        user = self.context['request'].user
        if hasattr(user, '_user_obj'):
            validated_data['user'] = user._user_obj
        else:
            from .models import User
            validated_data['user'] = User.objects.get(id=user.id)
        return super().create(validated_data)


class HistorySerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.name', read_only=True)
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    
    class Meta:
        model = History
        fields = [
            'id', 'person', 'person_name', 'change_type', 'field', 
            'detail', 'user_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        if hasattr(user, '_user_obj'):
            validated_data['user'] = user._user_obj
        else:
            from .models import User
            validated_data['user'] = User.objects.get(id=user.id)
        return super().create(validated_data)


class PersonAssociationSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.name', read_only=True)
    associate_name = serializers.CharField(source='associate.name', read_only=True)
    
    class Meta:
        model = PersonAssociation
        fields = ['id', 'person', 'person_name', 'associate', 'associate_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class GroupAssociationSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    
    class Meta:
        model = GroupAssociation
        fields = ['person', 'person_name', 'group', 'group_name', 'user_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        if hasattr(user, '_user_obj'):
            validated_data['user'] = user._user_obj
        else:
            from .models import User
            validated_data['user'] = User.objects.get(id=user.id)
        return super().create(validated_data)


class PersonDetailSerializer(PersonSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    history_entries = HistorySerializer(many=True, read_only=True)
    associates = serializers.SerializerMethodField()
    
    class Meta(PersonSerializer.Meta):
        fields = PersonSerializer.Meta.fields + ['groups', 'history_entries', 'associates']
    
    def get_associates(self, obj):
        associations = PersonAssociation.objects.filter(person=obj).select_related('associate')
        return PersonSerializer([assoc.associate for assoc in associations], many=True).data


class EntrySerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    people = PersonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Entry
        fields = ['id', 'content', 'processing_status', 'processing_result', 'user_id', 'people', 'created_at', 'updated_at']
        read_only_fields = ['id', 'processing_status', 'processing_result', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Get the actual User model instance from the FirebaseUser wrapper
        user = self.context['request'].user
        if hasattr(user, '_user_obj'):
            # This is a FirebaseUser wrapper, get the actual model
            validated_data['user'] = user._user_obj
        else:
            # Fallback - try to get by id
            from .models import User
            validated_data['user'] = User.objects.get(id=user.id)
        return super().create(validated_data)


class EntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = ['id', 'content']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        # Get the actual User model instance from the FirebaseUser wrapper
        user = self.context['request'].user
        if hasattr(user, '_user_obj'):
            # This is a FirebaseUser wrapper, get the actual model
            validated_data['user'] = user._user_obj
        else:
            # Fallback - try to get by id
            from .models import User
            validated_data['user'] = User.objects.get(id=user.id)
        return super().create(validated_data)


class EntryPersonSerializer(serializers.ModelSerializer):
    entry_id = serializers.UUIDField(source='entry.id', read_only=True)
    person_name = serializers.CharField(source='person.name', read_only=True)
    
    class Meta:
        model = EntryPerson
        fields = ['entry_id', 'person', 'person_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']