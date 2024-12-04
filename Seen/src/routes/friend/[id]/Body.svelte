<script lang="ts">  
  import snarkdown from 'snarkdown';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import 'easymde/dist/easymde.min.css'; // Import EasyMDE CSS


  export let data: { friend: { id: string; name: string; zip: string; body: string; intent: string, county: string }, 
                     associates: { id: string; name: string; intent: string }[],
                     journals: { id: string; title: string; person_id: string, created_at: Date; body: string }[],
                    groupData: { groupId: string; groupName: string}[] };

  export let isEditing: boolean;

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

{#if isEditing}
    <form method="POST" action="?/updateBody" class="form-style">
        <button type="submit" class="bg-blue-500 text-white px-6 py-3 text-lg rounded">Save</button>
        <input type="hidden" name="id" value={data.friend.id}>
        <input type="hidden" name="content" value={data.friend.body}>
    </form>  
    <textarea id="markdown-editor"></textarea>
{:else} 
<button on:click={toggleEdit} class= "text-gray px-6 py-3 text-lg" aria-label="Edit"><i class="fas fa-pencil-alt"></i> </button>
<div>{@html snarkdown(data.friend.body)}</div>
{/if}
<style>
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