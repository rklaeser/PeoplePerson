<script lang=ts>
    import Table from '../../../lib/components/Table.svelte';
    let searchQuery = '';

export let data: { group: {id: string; name: string},
                    people: { id: string; name: string; intent: string; county: string }[],
            };
</script>

<h1>{data.group.name}</h1>
<Table people={data.people} groupId={data.group.id}/>
