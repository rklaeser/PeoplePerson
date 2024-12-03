<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import 'easymde/dist/easymde.min.css'; // Import EasyMDE CSS
  import snarkdown from 'snarkdown';
  import { goto } from '$app/navigation';
  import counties from '$lib/stores/geojson-counties-fips.json'; // Adjust path as needed
  import type { FeatureCollection, Geometry } from 'geojson';

  // Explicitly type the imported JSON as a GeoJSON FeatureCollection
  const countiesData: FeatureCollection<Geometry> = counties as FeatureCollection<Geometry>;

  // Extract county names from the GeoJSON data
  const countyNames = countiesData.features
    .map(feature => feature.properties?.NAME)
    .filter(name => name != undefined);

  export let data: { friend: { id: string; name: string; zip: string; body: string; intent: string, county: string }, associates: { id: string; name: string; intent: string }[] };

  let htmlContent = snarkdown(data.friend.body);
  let editor: any;
  let isEditing = false;

  let newName = '';

  function navigateToFriend(id: string) {
    goto(`/friend/${id}`);
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
          htmlContent = snarkdown(plainText);
          return htmlContent;
        }
      });

      editor.value(data.friend.body);

      editor.codemirror.on('change', () => {
        data.friend.body = editor.value();
        htmlContent = snarkdown(data.friend.body);
      });

      editor.codemirror.focus();
    }
  }

  function toggleEdit() {
    isEditing = !isEditing;
    if (isEditing) {
      initializeEditor();
    }
  }

  // Reactive statement to update htmlContent when markdownContent changes
  $: htmlContent = snarkdown(data.friend.body);

  function handleCountySelect(event) {
    data.friend.county = event.target.value;
  }

  onMount(() => {
    // Initialize editor if already in editing mode
    if (isEditing) {
      initializeEditor();
    }
  });
</script>

<section>
  
  {#if data.friend.intent === 'romantic'}
	<h1 class="py-1 px-2 border-b border-gray-300">🌸{data.friend.name}🌸</h1>
  {:else if data.friend.intent === 'core'}
  <h1 class="py-1 px-2 border-b border-gray-300">🌻{data.friend.name}🌻</h1>
  {:else if data.friend.intent === 'archive'}
  <h1 class="py-1 px-2 border-b border-gray-300">🥀{data.friend.name}🥀</h1>
  {:else if data.friend.intent === 'new'}
  <h1 class="py-1 px-2 border-b border-gray-300">🌰{data.friend.name}🌰</h1>
  {:else if data.friend.intent === 'invest'}
  <h1 class="py-1 px-2 border-b border-gray-300">🌱{data.friend.name}🌱</h1>
  {:else if data.friend.intent === 'associate'}
  <h1 class="py-1 px-2 border-b border-gray-300">👥{data.friend.name}👥</h1>
  {:else}
  <h1 class="py-1 px-2 border-b border-gray-300">❓{data.friend.name}❓</h1>
  {/if}

  {#if isEditing}
    <form method="POST" action="?/update" class="form-style">
      <input type="hidden" name="id" value={data.friend.id}>
      <input type="hidden" name="content" value={data.friend.body}>
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
      <br>
      <div class="field-container">
        <label for="status">Status</label>
        <select id="intent" name="intent" bind:value={data.friend.intent} class="border px-2 py-1 mb-2">
          <option value="new">New</option>
          <option value="invest">Invest</option>
          <option value="core">Core</option>
          <option value="romantic">Romantic</option>
          <option value="archive">Archive</option>
          <option value="associate">Associate</option>        
        </select>
      </div>
      <div class="field-container">
        <label for="county">County</label>
        <input type="text" id="county" name="county" bind:value={data.friend.county} class="border px-2 py-1 mb-2" list="county-list" on:input={handleCountySelect}>
        <datalist id="county-list">
          {#each countyNames as county}
            <option value={county}>{county}</option>
          {/each}
        </datalist>
      </div>
    </form>  
    <textarea id="markdown-editor"></textarea>
    <div class="py-2 px-4 border-b border-gray-300">
      <input type="text" bind:value={newName} class="border px-2 py-1 mb-2" placeholder="Enter name" />
    </div>
    <form method="POST" action="?/createAssociation" class="form-style mt-4">
      <div class="field-container">
        <input type="hidden" name="id" value={data.friend.id}>
        <input type="hidden" name="associate" value={newName}>
      </div>
      <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Create Associate</button>
    </form>
  {:else} 
  <button on:click={toggleEdit} class="bg-blue-500 text-white px-4 py-2 rounded">Edit</button>
    <p>County {data.friend.county}</p> 
    <p>Status {data.friend.intent}</p> 
    <div>{@html htmlContent}</div>
  {/if}

  <h2>Associates</h2>
  <ul>
    {#each data.associates as associate}
    <button on:click={() => navigateToFriend(associate.id)}>{associate.name}</button>
    <form method="POST" action="?/deleteAssociation" class="form-style">
      <input type="hidden" name="id" value={data.friend.id}>
      <input type="hidden" name="associate" value={associate.id}>
      <button type="submit" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
    </form>
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
  .field-container {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* Adjust the gap between the label and input */
  }

</style>