#!/usr/bin/env python3
"""
Run Django CRUD server
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
    django.setup()
    
    # Run Django development server on port 8000
    sys.argv = ['manage.py', 'runserver', '0.0.0.0:8000']
    execute_from_command_line(sys.argv)