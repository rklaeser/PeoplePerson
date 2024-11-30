<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import 'easymde/dist/easymde.min.css'; // Import EasyMDE CSS

  export const prerender = false;

  export let data: { id: string; name: string; zip: string; body: string };

  let markdownContent = data.body;
  let editor: any;
  let isEditing = false;

  async function initializeEditor() {
    if (editor) {
      editor.toTextArea();
    }

    if (browser) {
      const EasyMDE = (await import('easymde')).default;

      editor = new EasyMDE({
        element: document.getElementById('markdown-editor') as HTMLTextAreaElement,
        initialValue: markdownContent,
        autofocus: true,
        autosave: {
          enabled: true,
          uniqueId: 'markdown-editor',
          delay: 1000,
        },
        placeholder: 'Type your Markdown content here...',
      });

      editor.value(markdownContent);

      editor.codemirror.on('change', () => {
        markdownContent = editor.value();
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

  onMount(() => {
    // Initialize editor if already in editing mode
    if (isEditing) {
      initializeEditor();
    }
  });
</script>

<section>
  <h1>{data.name}</h1>
  <p>{data.zip}</p>
  <p><strong>Friend Name:</strong> {data.name}</p>

  {#if isEditing}
    <textarea id="markdown-editor"></textarea>
    <form method="POST" action="?/update">
      <input type="hidden" name="id" value={data.id}>
      <input type="hidden" name="content" value={markdownContent}>
      <button type="submit" class="bg-red-500 text-black px-4 py-2 rounded">Save</button>
    </form>
  {:else}
    <div>{@html markdownContent}</div>
    <button on:click={toggleEdit} class="bg-blue-500 text-white px-4 py-2 rounded">Edit</button>
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  #markdown-editor {
    width: 100%;
    height: 300px;
  }
</style>