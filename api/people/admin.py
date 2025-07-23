from django.contrib import admin
from .models import User, Person, Group, History, GroupAssociation, PersonAssociation


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'firebase_uid', 'created_at']
    search_fields = ['name', 'email', 'firebase_uid']
    list_filter = ['created_at', 'email_verified']
    ordering = ['-created_at']


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ['name', 'intent', 'user', 'created_at']
    list_filter = ['intent', 'created_at']
    search_fields = ['name', 'body', 'mnemonic']
    ordering = ['name']
    date_hierarchy = 'created_at'


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['created_at']
    ordering = ['name']


@admin.register(History)
class HistoryAdmin(admin.ModelAdmin):
    list_display = ['person', 'field', 'change_type', 'created_at']
    list_filter = ['change_type', 'field', 'created_at']
    search_fields = ['person__name', 'detail']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'


@admin.register(GroupAssociation)
class GroupAssociationAdmin(admin.ModelAdmin):
    list_display = ['person', 'group', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['person__name', 'group__name']
    ordering = ['-created_at']


@admin.register(PersonAssociation)
class PersonAssociationAdmin(admin.ModelAdmin):
    list_display = ['person', 'associate', 'created_at']
    list_filter = ['created_at']
    search_fields = ['person__name', 'associate__name']
    ordering = ['-created_at']
