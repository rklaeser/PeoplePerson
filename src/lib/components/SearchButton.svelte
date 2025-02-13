<script lang="ts">
    export let expandSearch: boolean;

    function toggleSearch() {
        expandSearch = !expandSearch;
    }

</script>

<button
    class=" text-white px-4 py-2 rounded text-xl"
    aria-label="Edit"
    on:click={toggleSearch}
  >
  <i class="fa-solid fa-magnifying-glass"></i>
</button>