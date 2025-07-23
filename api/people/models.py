import uuid
from django.db import models


class IntentChoices(models.TextChoices):
    ROMANTIC = 'romantic', 'Romantic'
    CORE = 'core', 'Core'
    ARCHIVE = 'archive', 'Archive'
    NEW = 'new', 'New'
    INVEST = 'invest', 'Invest'
    ASSOCIATE = 'associate', 'Associate'


class ChangeTypeChoices(models.TextChoices):
    PROMPT = 'prompt', 'Prompt'
    MANUAL = 'manual', 'Manual'


class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firebase_uid = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    email_verified = models.DateTimeField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.name or self.email or str(self.id)


class Person(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    body = models.TextField(default='Add a description')
    intent = models.CharField(
        max_length=20, 
        choices=IntentChoices.choices, 
        default=IntentChoices.NEW
    )
    birthday = models.CharField(max_length=255, blank=True, null=True)
    mnemonic = models.CharField(max_length=255, blank=True, null=True)
    zip = models.CharField(max_length=20, blank=True, null=True)
    profile_pic_index = models.IntegerField(default=0)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='people',
        db_column='userId'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'people'
        ordering = ['name']

    def __str__(self):
        return self.name


class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='groups',
        db_column='userId'
    )
    people = models.ManyToManyField(
        Person, 
        through='GroupAssociation',
        related_name='groups'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'groups'
        ordering = ['name']

    def __str__(self):
        return self.name


class History(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey(
        Person, 
        on_delete=models.CASCADE, 
        related_name='history_entries',
        db_column='personId'
    )
    change_type = models.CharField(
        max_length=20, 
        choices=ChangeTypeChoices.choices,
        db_column='changeType'
    )
    field = models.CharField(max_length=255)
    detail = models.TextField()
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='history_entries',
        db_column='userId'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.person.name} - {self.field} - {self.change_type}"


class GroupAssociation(models.Model):
    person = models.ForeignKey(
        Person, 
        on_delete=models.CASCADE,
        db_column='personId'
    )
    group = models.ForeignKey(
        Group, 
        on_delete=models.CASCADE,
        db_column='groupId'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        db_column='userId'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'groupAssociations'
        unique_together = ('person', 'group')

    def __str__(self):
        return f"{self.person.name} in {self.group.name}"


class PersonAssociation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey(
        Person, 
        on_delete=models.CASCADE, 
        related_name='person_associations',
        db_column='personId'
    )
    associate = models.ForeignKey(
        Person, 
        on_delete=models.CASCADE, 
        related_name='associate_associations',
        db_column='associateId'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'personAssociations'
        unique_together = ('person', 'associate')

    def __str__(self):
        return f"{self.person.name} -> {self.associate.name}"
