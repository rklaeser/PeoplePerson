<script lang="ts">
    import { getProfilePicPosition } from '$lib/utils/profilePic';
    import spriteSheetUrl from '$lib/images/sprite.png';
    
    export let index: number;
    export let size: number = 32;
    export let className: string = '';
    
    $: position = getProfilePicPosition(index, size);
</script>

<div 
    class="profile-pic {className}"
    style="
        width: {size}px;
        height: {size}px;
        background-image: url({spriteSheetUrl});
        background-position: {position.backgroundPosition};
        background-size: {position.backgroundSize};
        background-repeat: no-repeat;
    "
    role="img"
    aria-label="Profile picture"
></div>

<style>
    .profile-pic {
        display: inline-block;
        border-radius: 50%;
        overflow: hidden;
    }
</style>