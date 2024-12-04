<script lang="ts">

  import '@fortawesome/fontawesome-free/css/all.css';
  import Associates from './Associates.svelte'; // Import the new Associates component
	import Status from './Status.svelte';
  import Location from './Location.svelte';
	import Groups from './Groups.svelte';
  import Body from './Body.svelte';
  import Journal from './Journal.svelte';
  import Name from './Name.svelte';

  export let data: { friend: { id: string; name: string; zip: string; body: string; intent: string, county: string }, 
                     associates: { id: string; name: string; intent: string }[],
                     journals: { id: string; title: string; person_id: string, created_at: Date; body: string }[],
                    groupData: { groupId: string; groupName: string}[] };

  let isEditing = false;
 
</script>

<section>
 
  <Name {data}/>
  <Status {data} {isEditing}/>
  <Location {data} {isEditing}/>
  <Groups {data} {isEditing}/>
  <Associates {data}/>
  <Body {data} {isEditing}/>  
  <Journal {data}/>

</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: left;
    flex: 0.1;
  }

</style>