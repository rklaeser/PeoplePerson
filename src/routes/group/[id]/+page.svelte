<script lang=ts>
    import Table from '../../../lib/components/Table.svelte';
    let searchQuery = '';

export let data: { group: {id: string; name: string},
                    people: { id: string; name: string; intent: string, body: string, birthday: string, mnemonic: string, createdAt: string, updatedAt: string }[],
            };
</script>

<h1>{data.group.name}</h1>
