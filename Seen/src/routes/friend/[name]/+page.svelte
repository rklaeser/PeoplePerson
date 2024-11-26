<script lang="ts">
  export let data: { id: string; name: string };
</script>

<section>
  <p>{data.name}</p>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>