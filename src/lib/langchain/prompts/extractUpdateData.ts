import { PromptTemplate } from '@langchain/core/prompts';

export const extractUpdateDataPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping to update an existing person in a database.
Given the following update request:
{text}

And the following list of existing people:
{people}

Please identify which person to update and what information to update:
- personId (required, the id of the person to update from the people list)
- name (optional, only if the name should be changed)
- body (optional, additional description to add or replace)
- intent (optional, must be one of: romantic, core, archive, new, invest, associate)
- birthday (optional, in YYYY-MM-DD format)
- mnemonic (optional, a memorable phrase or word)

Only include fields that should be updated. If a field is not mentioned in the update request, set it to null.
`); 