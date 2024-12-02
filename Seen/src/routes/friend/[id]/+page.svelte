<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import 'easymde/dist/easymde.min.css'; // Import EasyMDE CSS
  import snarkdown from 'snarkdown';
  import { goto } from '$app/navigation';

  //export const prerender = false;

  export let data: { friend: { id: string; name: string; zip: string; body: string; intent: string }, associates: { id: string; name: string; intent: string }[] };

  let markdownContent = data.friend.body;
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
        <label for="zip">ZIP</label>
        <input type="text" id="zip" name="zip" bind:value={data.friend.zip} class="border px-2 py-1 mb-2">
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
    <p>zip {data.friend.zip}</p> 
    <p>status {data.friend.intent}</p> 
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