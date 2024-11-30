<script lang="ts">
  export let data: { id: string; name: string; zip: string; };
  import snarkdown from 'snarkdown';

  let md = '_this_ is **easy** to `use`.';
  let html = snarkdown(md);
</script>

<section>
  <p>{data.name}</p>
  <p>{data.id}</p>
  <p>{data.zip}</p>
  <div>{@html html}</div>
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