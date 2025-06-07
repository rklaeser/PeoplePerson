import { PromptTemplate } from '@langchain/core/prompts';

export const extractPersonDataPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping to create a new person in a database.
Given the following description:
{text}

Please extract the following information:
- name (required)
- body (optional, description of the person). If there information provided about the person does not fit into another field, put it here.
- intent (optional, must be one of: romantic, core, archive, new, invest, associate). If none, default to new.
- birthday (optional, in YYYY-MM-DD format). If none, return null.
- mnemonic (optional, a memorable phrase or word). If none, create a mnemonic using three or fewer words for the person based off the name and any other information provided.
`); 