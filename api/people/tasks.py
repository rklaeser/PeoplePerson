from celery import shared_task
import requests
import json
from .models import Entry, Person, EntryPerson, User
from django.conf import settings


@shared_task
def process_entry_with_langchain(entry_id):
    """
    Alternative: Process entry directly using LangChain (without FastAPI)
    """
    from ai_service.workflows.graph import create_person_workflow
    import asyncio
    
    entry = None
    try:
        entry = Entry.objects.get(id=entry_id)
        user = entry.user
        
        # Update status
        entry.processing_status = 'processing'
        entry.save()
        
        # Get all user's friends for context
        all_friends = list(Person.objects.filter(user_id=user.id).values(
            'id', 'name', 'body', 'intent', 'mnemonic'
        ))
        
        # Create and run workflow
        workflow = create_person_workflow()
        initial_state = {
            "text": entry.content,
            "user_id": str(user.id),
            "all_friends": all_friends,
            "annotations": [],
            "result_people": [],
            "success": False
        }
        
        # Run async workflow in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        final_state = loop.run_until_complete(workflow.ainvoke(initial_state))
        loop.close()
        
        # Process results
        if final_state.get('success'):
            for person_data in final_state.get('result_people', []):
                person = Person.objects.get(id=person_data['id'])
                EntryPerson.objects.get_or_create(
                    entry=entry,
                    person=person
                )
            
            entry.processing_status = 'completed'
            entry.processing_result = final_state.get('result_message', '')
        else:
            entry.processing_status = 'failed'
            entry.processing_result = final_state.get('result_message', 'Unknown error')
            
        entry.save()
        
    except Exception as e:
        if entry:
            entry.processing_status = 'failed'
            entry.processing_result = str(e)
            entry.save()
        raise


def get_service_token():
    """
    Get a service account token for internal API calls
    This is a placeholder - implement based on your auth setup
    """
    # Option 1: Use a long-lived service account token
    # return settings.SERVICE_ACCOUNT_TOKEN
    
    # Option 2: Generate a token using Firebase Admin SDK
    # from firebase_admin import auth
    # custom_token = auth.create_custom_token('service-account')
    # return custom_token
    
    # For now, return empty string
    return ''