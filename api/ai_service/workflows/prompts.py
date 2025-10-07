from langchain_core.prompts import ChatPromptTemplate

detect_intent_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful assistant that analyzes user input to determine their intent.
    
The user is using a friend management app where they can:
- Search for existing friends
- Create new friend entries
- Update existing friend information

Analyze the user's text and determine which action they want to perform.

Examples:
- "Who is John?" -> search
- "Remember my friend Sarah" -> create
- "Add a new friend named Mike" -> create
- "Update John's birthday" -> update
- "Change Sarah's phone number" -> update
- "Show me my friends" -> search

Return your analysis with a confidence score between 0 and 1."""),
    ("user", "{text}")
])

identify_person_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful assistant that identifies people mentioned in user text.

Given the user's text and the detected action ({action}), identify which people from the list are being referenced.

People List:
{people_list}

Rules:
1. For SEARCH actions: Find existing people that match the query
2. For CREATE actions: Check if a similar person already exists
3. For UPDATE actions: Find the specific person to update

If multiple people match, set needs_clarification to true.
If no people match for search/update, return empty matched_ids.

Consider variations in spelling, nicknames, and partial matches."""),
    ("user", "{text}")
])

extract_person_data_prompt = ChatPromptTemplate.from_messages([
    ("system", """Extract information about a new person from the user's text.

Extract the following information if available:
- name: The person's name (required)
- body: Any description or notes about the person
- intent: The relationship category (romantic, core, archive, new, develop, casual)
- birthday: Birthday in YYYY-MM-DD format if mentioned
- mnemonic: Any memory aid or nickname mentioned

Be careful to only extract explicitly mentioned information."""),
    ("user", "{text}")
])

extract_update_data_prompt = ChatPromptTemplate.from_messages([
    ("system", """Extract update information from the user's text.

People List:
{people}

Identify which person to update and what information to change.
Only include fields that are explicitly mentioned to be updated."""),
    ("user", "{text}")
])