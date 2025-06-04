<script lang="ts">  
  import snarkdown from 'snarkdown';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { Carta, MarkdownEditor, Markdown } from 'carta-md';
  import debounce from 'debounce';
  import { marked } from 'marked';
  import type { Friend, Group, Journal, Associate } from '$lib/types';

  const carta = new Carta({
    sanitizer: false
  });

  let value = '# H1';

  export let data: { 
    friend: Friend;
    associates: Associate[];
    journals: Journal[];
    groupData: Group[];
  };

  let isEditing = false;

  let editor: any;

  function toggleEdit() {
    isEditing = !isEditing;
    if (isEditing) {
      initializeEditor();
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
  onMount(() => {
    // Initialize editor if already in editing mode
    if (isEditing) {
      initializeEditor();
    }
  });
</script>

<div class="relative">
  {#if isEditing}
    <form method="POST" action="?/updateBody" class="flex flex-col gap-4 w-full">
      <button type="submit" class="bg-blue-500 text-white px-6 py-3 text-lg rounded">Save</button>
      <input type="hidden" name="id" value={data.friend.id}>
      <input type="hidden" name="content" value={data.friend.body}>
    </form>  
    <textarea id="markdown-editor" class="w-full h-72"></textarea>
  {:else} 
    <button on:click={toggleEdit} class="absolute top-[-15px] right-0 text-gray-500 px-6 py-3 text-lg" aria-label="Edit"><i class="fas fa-pencil-alt"></i></button>
    <div>{@html snarkdown(data.friend.body)}</div>
  {/if}
</div>
<style>
    #markdown-editor {
        width: 100%;
        height: 300px;
    }
</style>