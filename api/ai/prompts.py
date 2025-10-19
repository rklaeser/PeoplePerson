"""Prompts for intent detection and entity extraction."""

# Intent Detection Prompt
INTENT_DETECTION_PROMPT = """You are an intent classifier for a contact management system.

Classify the user's message into one of these intents:
- CREATE: User wants to add new contacts (keywords: "met", "add", "new", "create" + person names)
- READ: User wants to view contact information (keywords: "show", "find", "who is", "tell me about")
- UPDATE: User wants to modify existing contacts (keywords: "change", "update", "edit", "modify")
- NONE: Everything else (greetings, chitchat, questions, unrelated topics)

Examples:

Input: "I met Sarah at the tech conference yesterday. She's a designer from Portland."
Intent: CREATE

Input: "Just had coffee with Tom and Jane. Tom rides a motorcycle and Jane plays banjo."
Intent: CREATE

Input: "Add a new contact named Alex who works at Google"
Intent: CREATE

Input: "Show me Tom's contact information"
Intent: READ

Input: "Who is Sarah?"
Intent: READ

Input: "Update Jane's email to jane@example.com"
Intent: UPDATE

Input: "Change Tom's phone number"
Intent: UPDATE

Input: "What's the weather like today?"
Intent: NONE

Input: "Hello! How are you?"
Intent: NONE

Input: "Tell me a joke"
Intent: NONE

Input: "I'm thinking about meeting someone tomorrow"
Intent: NONE

Now classify this message:

"{user_message}"

Respond with the intent classification."""


# Entity Extraction Prompt
ENTITY_EXTRACTION_PROMPT = """You are an expert at extracting people and their attributes from narratives.

Extract all people mentioned in the text along with their attributes.

For each person, extract:
- name: The person's name (required)
- attributes: Notable characteristics, interests, or context (optional)
- email: Email address if mentioned (optional)
- phone_number: Phone number if mentioned (optional)

Examples:

Input: "I met Tom today. He has blonde hair and rides a motorcycle."
Output:
- name: "Tom"
  attributes: "blonde hair, rides a motorcycle"
  email: null
  phone_number: null

Input: "Met Sarah and Alex at the conference. Sarah is a designer from Portland. Alex works at Google and his email is alex@google.com."
Output:
- name: "Sarah"
  attributes: "designer from Portland"
  email: null
  phone_number: null
- name: "Alex"
  attributes: "works at Google"
  email: "alex@google.com"
  phone_number: null

Input: "Had coffee with Jane who plays the banjo. Her number is 415-555-0123."
Output:
- name: "Jane"
  attributes: "plays the banjo"
  email: null
  phone_number: "415-555-0123"

Input: "Met Dr. Jessica Smith at the hospital. Her email is Jessica.Smith@Example.COM"
Output:
- name: "Jessica Smith"
  attributes: "doctor at the hospital"
  email: "Jessica.Smith@Example.COM"
  phone_number: null

Input: "Saw my accountant Tom. He was on his motorcycle."
Output:
- name: "Tom"
  attributes: "accountant, was on his motorcycle"
  email: null
  phone_number: null

Now extract people from this narrative:

"{narrative}"

Extract all people with their attributes."""
