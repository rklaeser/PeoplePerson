from django.core.management.base import BaseCommand
from django.db import transaction
from people.models import User, Person, Group, History, GroupAssociation
from django.conf import settings
from django.utils import timezone
import uuid
from datetime import datetime, timedelta
import random
import firebase_admin
from firebase_admin import credentials, auth
import os


class Command(BaseCommand):
    help = 'Seed the database with initial demo data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Step 1: Initialize Firebase Admin SDK
        try:
            # Check if Firebase is already initialized
            from firebase_admin import _apps
            if not _apps:
                # Get Firebase config from environment
                FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
                FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', settings.FIREBASE_PROJECT_ID)
                
                if FIREBASE_SERVICE_ACCOUNT_PATH:
                    # Use service account file
                    cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
                    firebase_admin.initialize_app(cred, options={
                        'projectId': FIREBASE_PROJECT_ID
                    })
                    self.stdout.write('Initialized Firebase Admin SDK with service account')
                else:
                    # For emulator or development - use Application Default Credentials
                    os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "localhost:9099"
                    firebase_admin.initialize_app(options={
                        'projectId': FIREBASE_PROJECT_ID
                    })
                    self.stdout.write('Initialized Firebase Admin SDK for emulator')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Firebase initialization failed: {e}'))
        
        # Step 2: Create Firebase user first
        try:
            firebase_user = auth.create_user(
                email='dwight@schrutefarms.com',
                password='beetsbears',
                display_name='Dwight Schrute',
                email_verified=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created Firebase user: {firebase_user.display_name}'))
            firebase_uid = firebase_user.uid
            
        except auth.EmailAlreadyExistsError:
            # User already exists, get the existing one
            firebase_user = auth.get_user_by_email('dwight@schrutefarms.com')
            self.stdout.write(f'Firebase user already exists: {firebase_user.display_name}')
            firebase_uid = firebase_user.uid
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error with Firebase: {e}'))
            self.stdout.write('Using fallback demo UID for development')
            firebase_uid = 'demo-firebase-uid'
        
        # Step 3: Create database user with real Firebase UID
        with transaction.atomic():
            demo_user, created = User.objects.get_or_create(
                firebase_uid=firebase_uid,
                defaults={
                    'name': 'Dwight Schrute',
                    'email': 'dwight@schrutefarms.com',
                    'email_verified': timezone.now()
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created database user: {demo_user.name} (ID: {demo_user.id})'))
            else:
                self.stdout.write(f'Database user already exists: {demo_user.name} (ID: {demo_user.id})')
            
            # Show login credentials
            self.stdout.write(self.style.SUCCESS('=== LOGIN CREDENTIALS ==='))
            self.stdout.write(f'Email: dwight@schrutefarms.com')
            self.stdout.write(f'Password: beetsbears')
            self.stdout.write(f'Firebase UID: {firebase_uid}')
            self.stdout.write(f'Database ID: {demo_user.id}')
            self.stdout.write('=========================')
            
            # Create groups
            groups_data = [
                {'name': 'Family', 'description': 'Family members'},
                {'name': 'Work', 'description': 'Colleagues from Dunder Mifflin'},
                {'name': 'Beet Farm', 'description': 'Schrute Farms associates'},
                {'name': 'Battlestar Galactica Fans', 'description': 'Fellow BSG enthusiasts'}
            ]
            
            groups = {}
            for group_data in groups_data:
                group, created = Group.objects.get_or_create(
                    name=group_data['name'],
                    user=demo_user,
                    defaults={'description': group_data['description']}
                )
                groups[group.name] = group
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created group: {group.name}'))
            
            # Create people
            people_data = [
                {
                    'name': 'Jim Halpert',
                    'body': 'Sales representative. Constant pranker. Married to Pam.',
                    'intent': 'core',
                    'mnemonic': 'Jim = Jello stapler prankster',
                    'groups': ['Work']
                },
                {
                    'name': 'Pam Beesly',
                    'body': 'Receptionist turned saleswoman. Married to Jim. Artist.',
                    'intent': 'core',
                    'mnemonic': 'Pam = Painting artist mom',
                    'groups': ['Work']
                },
                {
                    'name': 'Michael Scott',
                    'body': 'Regional Manager. World\'s best boss (self-proclaimed).',
                    'intent': 'invest',
                    'mnemonic': 'Michael = Manager comedy central',
                    'groups': ['Work']
                },
                {
                    'name': 'Angela Martin',
                    'body': 'Head of Accounting. Cat lover. Very judgmental.',
                    'intent': 'core',
                    'mnemonic': 'Angela = Angry accountant cats',
                    'groups': ['Work']
                },
                {
                    'name': 'Mose Schrute',
                    'body': 'Cousin. Lives on the beet farm. Runs really fast.',
                    'intent': 'core',
                    'mnemonic': 'Mose = Mute odd sprinter',
                    'groups': ['Family', 'Beet Farm']
                },
                {
                    'name': 'Cousin Zeke',
                    'body': 'Makes moonshine. Plays the banjo.',
                    'intent': 'casual',
                    'mnemonic': 'Zeke = Zealous Kentucky moonshiner',
                    'groups': ['Family']
                }
            ]
            
            for person_data in people_data:
                person_groups = person_data.pop('groups', [])
                person, created = Person.objects.get_or_create(
                    name=person_data['name'],
                    user=demo_user,
                    defaults=person_data
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created person: {person.name}'))
                    
                    # Add to groups
                    for group_name in person_groups:
                        if group_name in groups:
                            GroupAssociation.objects.get_or_create(
                                person=person,
                                group=groups[group_name],
                                user=demo_user
                            )
                    
                    # Add some history
                    History.objects.create(
                        person=person,
                        change_type='manual',
                        field='created',
                        detail=f'Added {person.name} to the system',
                        user=demo_user
                    )
            
            self.stdout.write(self.style.SUCCESS('Database seeding completed!'))