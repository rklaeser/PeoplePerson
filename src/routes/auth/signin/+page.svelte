<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import { goto } from '$app/navigation';

  async function demoLogin() {
    // Redirect directly to demo route (no session needed)
    goto('/demo');
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
  <div class="card w-96 bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title justify-center mb-6">Sign in to FriendShip</h2>
      
      <div class="card-actions flex flex-col gap-4">
        <button 
          class="btn btn-primary w-full gap-2"
          on:click={() => signIn('github')}
        >
          <i class="fab fa-github"></i>
          Sign in with GitHub
        </button>
        
        <div class="divider">OR</div>
        
        <button 
          class="btn btn-secondary w-full gap-2"
          on:click={demoLogin}
        >
          <i class="fas fa-user"></i>
          Try Dwight Schrute Demo
        </button>
        
        <p class="text-sm text-center text-gray-500 mt-2">
          Demo mode lets you explore the app with sample data
        </p>
      </div>
    </div>
  </div>
</div>