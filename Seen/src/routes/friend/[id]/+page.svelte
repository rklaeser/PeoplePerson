<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import 'easymde/dist/easymde.min.css'; // Import EasyMDE CSS
  import snarkdown from 'snarkdown';
  import { goto } from '$app/navigation';
  import counties from '$lib/stores/geojson-counties-fips.json'; // Adjust path as needed
  import type { FeatureCollection, Geometry } from 'geojson';
  import '@fortawesome/fontawesome-free/css/all.css';

  // Explicitly type the imported JSON as a GeoJSON FeatureCollection
  const countiesData: FeatureCollection<Geometry> = counties as FeatureCollection<Geometry>;

  // Extract county names from the GeoJSON data
  const countyNames = countiesData.features
    .map(feature => feature.properties?.NAME)
    .filter(name => name != undefined);

  export let data: { friend: { id: string; name: string; zip: string; body: string; intent: string, county: string }, 
                     associates: { id: string; name: string; intent: string }[],
                     journals: { id: string; title: string; person_id: string, created_at: Date; body: string }[] };

  let editor: any;
  let journalEditor: any;
  let isEditing = false;
  let isCreatingJournal = false;
  let journalContent = '';
  let expandedJournalIds: string[] = [];
  let isAddingAssociate = false;
  let newAssociateName = '';

  let newName = '';

  function navigateToFriend(id: string) {
    goto(`/friend/${id}`);
  }

  function toggleAddAssociate() {
    isAddingAssociate = !isAddingAssociate;
  }

  function expandJournal(id: string, content: string) {
    console.log('Content: ', content);
    if(expandedJournalIds.includes(id)) {
      expandedJournalIds = expandedJournalIds.filter(journalId => journalId !== id);
    } else {
      expandedJournalIds = [...expandedJournalIds, id];
    }
  }

  async function initializeEditor() {
    if (editor) {
      editor.toTextArea();
    }

    if (browser) {
      const EasyMDE = (await import('easymde')).default;

      editor = new EasyMDE({
        element: document.getElementById('markdown-editor') as HTMLTextAreaElement,
        initialValue: data.friend.body,
        autofocus: true,
        autosave: {
          enabled: true,
          uniqueId: 'markdown-editor',
          delay: 1000,
        },
        placeholder: 'Type your Markdown content here...',
        previewRender: (plainText) => {
          return snarkdown(plainText);
        }
      });

      editor.value(data.friend.body);

      editor.codemirror.on('change', () => {
        data.friend.body = editor.value();
      });

      editor.codemirror.focus();
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
    if (isEditing) {
      initializeEditor();
    }
  }

  function toggleJournalEditor() {
    isCreatingJournal = !isCreatingJournal;
    if (isCreatingJournal) {
      initializeJournalEditor();
    }
  }

  onMount(() => {
    // Initialize editor if already in editing mode
    if (isEditing) {
      initializeEditor();
    }
  });
</script>

<section>
  <div class="flex items-center justify-between mt-8">
    {#if data.friend.intent === 'romantic'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🌸</h1>
    {:else if data.friend.intent === 'core'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🌻</h1>
    {:else if data.friend.intent === 'archive'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🥀</h1>
    {:else if data.friend.intent === 'new'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🌰</h1>
    {:else if data.friend.intent === 'invest'}
    <h1 class="py-1 px-2  text-4xl">{data.friend.name}🌱</h1>
    {:else if data.friend.intent === 'associate'}
    <h1 class="py-1 px-2  text-4xl">{data.friend.name}👥</h1>
    {:else}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}❓</h1>
    {/if}
    {#if !isEditing}
    <button on:click={toggleEdit} class= "text-gray px-6 py-3 text-lg"><i class="fas fa-pencil-alt"></i> Edit</button>
    {:else}
    <button type="submit" form="edit-form" class="bg-blue-500 text-white px-6 py-3 text-lg rounded">Save</button>
    {/if}
  </div>

  {#if isEditing}
    <form id="edit-form" method="POST" action="?/update" class="form-style">
      <input type="hidden" name="id" value={data.friend.id}>
      <input type="hidden" name="content" value={data.friend.body}>
      <br>
      <div class="flex items-center gap-2 mb-2">
        <label for="status"><i class="fa-solid fa-seedling"></i></label>
        <select id="intent" name="intent" bind:value={data.friend.intent} class="border px-2 py-1">
          <option value="new">New</option>
          <option value="invest">Invest</option>
          <option value="core">Core</option>
          <option value="romantic">Romantic</option>
          <option value="archive">Archive</option>
          <option value="associate">Associate</option>        
        </select>
      </div>
      <div class="flex items-center gap-2 mb-2">
        <label for="county"><i class="fa-solid fa-location-dot"></i></label>
        <input type="text" id="county" name="county" bind:value={data.friend.county} class="border px-2 py-1 mb-2" list="county-list">
        <datalist id="county-list">
          {#each countyNames as county}
            <option value={county}>{county}</option>
          {/each}
        </datalist>
      </div>
    </form>  
    <textarea id="markdown-editor"></textarea>

  {:else} 
    <p><i class="fa-solid fa-seedling"></i> {data.friend.intent}</p> 
    <p><i class="fa-solid fa-location-dot"></i> {data.friend.county}</p> 
    <hr class="my-4 border-gray-300">
    <div>{@html snarkdown(data.friend.body)}</div>
  {/if}
  <hr class="my-4 border-gray-300">
  <div class="flex items-center justify-between mt-8">
    <h2 class="text-2xl">Associates</h2>
    <button on:click={toggleAddAssociate} class="bg-blue-500 text-white px-4 py-2 rounded">+ Add Associate</button>
  </div>
  {#if isAddingAssociate}
    <form method="POST" action="?/createAssociation" class="form-style mt-4">
      <input type="hidden" name="id" value={data.friend.id}>
      <div class="mb-4">
        <label for="newAssociateName" class="block text-sm font-medium text-gray-700">Associate Name</label>
        <input type="text" id="newAssociateName" name="associate" bind:value={newAssociateName} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter associate name">
      </div>
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
    </form>
  {/if}
  <ul>
    {#each data.associates as associate}
  <div class="flex items-center justify-between">
    <button on:click={() => navigateToFriend(associate.id)} class="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded">{associate.name}</button>
    <div>
      <form method="POST" action="?/deleteAssociation" class="form-style">  
        <input type="hidden" name="id" value={data.friend.id}>
        <input type="hidden" name="associate" value={associate.id}>
        <button type="submit" class="bg-red-500 text-white px-4 py-2 rounded-full text-sm">X</button>
      </form>
    </div>
</div>
    <hr class="my-4 border-gray-300">
    {/each}
  </ul>
  <div class="flex items-center justify-between mt-8">
    <h2 class="text-2xl">Journal Entries</h2>
    <button on:click={toggleJournalEditor} class="bg-blue-500 text-white px-4 py-2 rounded">+ Add Journal Entry</button>
  </div> 
  {#if isCreatingJournal}
  <form method="POST" action="?/createJournal" class="form-style">
    <input type="hidden" name="id" value={data.friend.id}>
    <input type="hidden" name="content" value={journalContent}>
    <div class="mb-4">
      <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
      <input type="text" id="title" name="title" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter title">
    </div>
    <textarea id="journal-editor" class="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">Save</button>
  </form>
  {/if} 
<ul>
  {#each data.journals as journal}
    <li>
      {#if expandedJournalIds.includes(journal.id)}
          <div class="journal-content">{@html snarkdown(journal.body || '')}</div>
        {/if}
        <div class="flex items-center justify-between">
        <button on:click={() => expandJournal(journal.id, journal.body)} class="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded">{journal.title}  {journal.created_at.toLocaleDateString()}</button>
          <div>
            <form method="POST" action="?/deleteJournal" class="form-style">
              <input type="hidden" name="id" value={journal.id}>
              <button type="submit" class="bg-red-500 text-white px-4 py-2 rounded-full text-sm">X</button>
          </form>
          </div>
        </div>
        <hr class="my-4 border-gray-300">
    </li>
  {/each}
</ul>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: left;
    flex: 0.1;
  }

  #markdown-editor {
    width: 100%;
    height: 300px;
  }

  .form-style {
    display: flex;
    flex-direction: column;
    gap: 1rem; /* Adjust the gap between form elements */
    width: 100%; /* Make the form take the full width */
  }
</style>