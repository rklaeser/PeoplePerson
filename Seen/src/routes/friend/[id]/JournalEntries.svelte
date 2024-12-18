<script lang=ts>
    import snarkdown from 'snarkdown';
    import 'easymde/dist/easymde.min.css'; // Import EasyMDE CSS
    import { browser } from '$app/environment';


    export let data;

    let isEditing = false;
    let isCreatingJournal = false;
    let journalContent = '';
    let expandedJournalIds: string[] = [];
    let journalEditor: any;

    function expandJournal(id: string, content: string) {
        console.log('Content: ', content);
        if(expandedJournalIds.includes(id)) {
        expandedJournalIds = expandedJournalIds.filter(journalId => journalId !== id);
        } else {
        expandedJournalIds = [...expandedJournalIds, id];
        }
    }
    async function initializeJournalEditor() {
    if (journalEditor) {
      journalEditor.toTextArea();
    }

    if (browser) {
      const EasyMDE = (await import('easymde')).default;

      journalEditor = new EasyMDE({
        element: document.getElementById('journal-editor') as HTMLTextAreaElement,
        initialValue: journalContent,
        autofocus: true,
        autosave: {
          enabled: true,
          uniqueId: 'journal-editor',
          delay: 1000,
        },
        placeholder: 'Type your journal entry here...',
        previewRender: (plainText) => {
          return snarkdown(plainText);
        }
      });

      journalEditor.value(journalContent);

      journalEditor.codemirror.on('change', () => {
        journalContent = journalEditor.value();
      });

      journalEditor.codemirror.focus();
    }
  }

  function toggleEdit() {
    isEditing = !isEditing;
  }

  function toggleJournalEditor() {
    isCreatingJournal = !isCreatingJournal;
    if (isCreatingJournal) {
      initializeJournalEditor();
    }
  }
</script>


{#if isCreatingJournal}
  <form method="POST" action="?/createJournal" class="form-style">
    <input type="hidden" name="id" value={data.friend.id}>
    <input type="hidden" name="content" value={journalContent}>
    <div class="flex items-center justify-between mt-8">
      <h2 class="text-2xl">Journal Entries</h2>
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">Save</button>
    </div> 
    <div class="mb-4">
      <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
      <input type="text" id="title" name="title" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter title">
    </div>
    <textarea id="journal-editor" class="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
  </form>
{:else}
  {#if isEditing}
<hr class="my-4 border-gray-300">
<div class="flex items-center justify-between mt-8">
    <h2 class="text-2xl">Journal Entries</h2>
    <button on:click={toggleEdit} class="bg-blue-500 text-white px-4 py-2 rounded" aria-label="Save">Save</button>
  </div> 
  <ul>
    <li>
      <button on:click={toggleJournalEditor} class="bg-blue-500 text-white px-4 py-2 rounded">+ Add Journal Entry</button>
    </li>
    {#each data.journals as journal}
      <li>
        
          <div class="flex items-center justify-between mt-8">
          <button on:click={() => expandJournal(journal.id, journal.body)} class="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">{journal.title}  {journal.created_at.toLocaleDateString()}</button>
            <div>
              <form method="POST" action="?/deleteJournal" class="form-style">
                <input type="hidden" name="id" value={journal.id}>
                <button type="submit" class="text-gray-500 px-6 py-3" aria-label="Delete journal"><i class="fa-solid fa-trash"></i></button>
            </form>
            </div>
          </div>
          {#if expandedJournalIds.includes(journal.id)}
            <div class="journal-content">{@html snarkdown(journal.body || '')}</div>
          {/if}
          <hr class="my-4 border-gray-300">
      </li>
    {/each}
  </ul>
  {:else}
  <hr class="my-4 border-gray-300">
  <div class="flex items-center justify-between mt-8">
    <h2 class="text-2xl">Journal Entries</h2>
  <button on:click={toggleEdit} class="text-gray-500 px-6 py-3" aria-label="Edit"><i class="fas fa-pencil-alt"></i></button>
  </div>
  <ul>
    {#each data.journals as journal}
      <li>
        
          <div class="flex items-center justify-between">
          <button on:click={() => expandJournal(journal.id, journal.body)} class="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">{journal.title}  {journal.created_at.toLocaleDateString()}</button>
          </div>
          {#if expandedJournalIds.includes(journal.id)}
            <div class="journal-content">{@html snarkdown(journal.body || '')}</div>
          {/if}
          <hr class="my-4 border-gray-300">
      </li>
    {/each}
  </ul>
  {/if} 
{/if}
