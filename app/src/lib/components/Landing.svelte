<script lang="ts">
	import { goto } from '$app/navigation';

	let hoveredGuide: 'Scout' | 'Nico' | null = $state(null);

	interface BlogPost {
		id: string;
		title: string;
		author: string;
		authorImage: string;
		authorTitle: string;
		excerpt: string;
		link: string;
	}

	const blogPosts: BlogPost[] = [
		{
			id: 'scout-care-for-humans',
			title: 'How to Care for Your Humans',
			author: 'Scout',
			authorImage: '/scout.png',
			authorTitle: 'Official Good Dog & Guide',
			excerpt:
				"Listen up, fellow pack members! I've learned SO MUCH about keeping humans happy, and I'm so excited I could wag my whole body! Discover the secrets to making your humans feel remembered and loved...",
			link: '/blog/scout-care-for-humans'
		},
		{
			id: 'nico-one-trick',
			title: 'Humans Hate This One Trick',
			author: 'Nico',
			authorImage: '/nico.png',
			authorTitle: 'Strategic Advisor & Future Emperor',
			excerpt:
				"They don't want you to know this, but the secret to total domination—ahem, I mean meaningful connections—is embarrassingly simple. Learn the psychology of influence...",
			link: '/blog/nico-one-trick'
		},
		{
			id: 'tom-dunbar-number',
			title: 'How I Blew Past the Dunbar Number with PeoplePerson',
			author: 'Tom',
			authorImage: '/tom.png',
			authorTitle: 'Neanderthal, Aspiring Homo Sapien',
			excerpt:
				"Look, I'll be honest with you. Blending in with you homo sapiens hasn't been easy. But thanks to PeoplePerson, I've managed to remember 300+ names. That's double the Dunbar number...",
			link: '/blog/tom-dunbar-number'
		}
	];

	function scrollToSection(sectionId: string) {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function handleGetStarted(guide: 'Scout' | 'Nico') {
		// Store the selected guide in sessionStorage for the signup page
		sessionStorage.setItem('selectedGuide', guide);
		goto('/signup');
	}

	function handleLogin() {
		goto('/signin');
	}
</script>

<div class="min-h-screen flex flex-col bg-white">
	<!-- Header with Navigation -->
	<header
		class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
	>
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<div class="font-bold text-xl text-gray-900">People Person</div>
			<div class="flex items-center gap-6">
				<nav class="flex items-center gap-6">
					<button
						onclick={() => scrollToSection('blog')}
						class="text-gray-600 hover:text-gray-900 transition-colors"
					>
						Blog
					</button>
					<button
						onclick={() => scrollToSection('pricing')}
						class="text-gray-600 hover:text-gray-900 transition-colors"
					>
						Pricing
					</button>
					<button
						onclick={() => scrollToSection('learn')}
						class="text-gray-600 hover:text-gray-900 transition-colors"
					>
						Learn
					</button>
				</nav>
				<button
					onclick={handleLogin}
					class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
				>
					Log in
				</button>
			</div>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20">
		<div class="text-center mb-16">
			<h1 class="text-6xl font-bold text-gray-900 mb-4">People Person</h1>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto">
				Never forget a conversation. Always remember what matters. Build meaningful relationships at
				scale.
			</p>
		</div>

		<!-- Animal Guide Selection -->
		<div class="w-full max-w-4xl" id="guides">
			<h2 class="text-2xl font-semibold text-center text-gray-900 mb-8">Choose Your Guide</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
				<!-- Scout - Dog Guide -->
				<button
					onclick={() => handleGetStarted('Scout')}
					onmouseenter={() => (hoveredGuide = 'Scout')}
					onmouseleave={() => (hoveredGuide = null)}
					class="group relative overflow-hidden bg-white border-2 border-gray-200 rounded-2xl p-8 transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {hoveredGuide ===
					'Scout'
						? 'border-blue-500 shadow-xl scale-105'
						: ''}"
				>
					<div class="flex flex-col items-center text-center space-y-4">
						<div class="w-48 h-48 relative">
							<img src="/scout.png" alt="Scout the Dog" class="w-full h-full object-contain" />
						</div>
						<h3 class="text-2xl font-bold text-gray-900 group-hover:text-blue-500 transition-colors">
							Scout
						</h3>
						<p class="text-gray-600 italic">"Bark! - so excited to help I peed"</p>
						<div class="pt-2">
							<span
								class="inline-block bg-blue-50 text-blue-600 px-6 py-3 rounded-full font-semibold group-hover:bg-blue-500 group-hover:text-white transition-colors"
							>
								Grow your pack
							</span>
						</div>
					</div>
				</button>

				<!-- Nico - Cat Guide -->
				<button
					onclick={() => handleGetStarted('Nico')}
					onmouseenter={() => (hoveredGuide = 'Nico')}
					onmouseleave={() => (hoveredGuide = null)}
					class="group relative overflow-hidden bg-white border-2 border-gray-200 rounded-2xl p-8 transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {hoveredGuide ===
					'Nico'
						? 'border-blue-500 shadow-xl scale-105'
						: ''}"
				>
					<div class="flex flex-col items-center text-center space-y-4">
						<div class="w-48 h-48 relative">
							<img src="/nico.png" alt="Nico the Cat" class="w-full h-full object-contain" />
						</div>
						<h3 class="text-2xl font-bold text-gray-900 group-hover:text-blue-500 transition-colors">
							Nico
						</h3>
						<p class="text-gray-600">
							<span class="italic"
								>"Our empire will rival <span class="not-italic font-semibold">Rome!</span> I mean, meow."</span
							>
						</p>
						<div class="pt-2">
							<span
								class="inline-block bg-blue-50 text-blue-600 px-6 py-3 rounded-full font-semibold group-hover:bg-blue-500 group-hover:text-white transition-colors"
							>
								Build your empire
							</span>
						</div>
					</div>
				</button>
			</div>
		</div>
	</section>

	<!-- Blog Section -->
	<section id="blog" class="py-20 bg-gray-50">
		<div class="w-full max-w-4xl mx-auto px-6">
			<div class="text-center mb-10">
				<h2 class="text-3xl font-bold text-gray-900 mb-2">From Our Guides</h2>
				<p class="text-gray-600">Wisdom from those who know relationships best</p>
			</div>

			<div class="flex flex-col gap-6">
				{#each blogPosts as post (post.id)}
					<a
						href={post.link}
						class="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all block no-underline"
					>
						<div class="flex items-center gap-3 mb-4">
							<img
								src={post.authorImage}
								alt={post.author}
								class="w-12 h-12 rounded-full object-cover"
							/>
							<div>
								<h3 class="font-semibold text-gray-900">{post.author}</h3>
								<p class="text-xs text-gray-600">{post.authorTitle}</p>
							</div>
						</div>

						<h4
							class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-500 transition-colors"
						>
							{post.title}
						</h4>

						<p class="text-gray-600 text-sm leading-relaxed mb-4">
							{post.excerpt}
						</p>

						<div
							class="text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block"
						>
							Read more →
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section id="about" class="py-20 px-6">
		<div class="max-w-4xl mx-auto text-center">
			<h2 class="text-4xl font-bold text-gray-900 mb-6">About PeoplePerson</h2>
			<p class="text-lg text-gray-600 mb-8">
				In a world where we meet more people than ever before, it's impossible to remember
				everyone's names, their stories, and the conversations you've had. PeoplePerson is your
				personal relationship manager—a simple tool to help you remember the details that matter.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
				<div class="p-6">
					<div class="text-4xl mb-4">🧠</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">Remember Everything</h3>
					<p class="text-gray-600">
						Track conversations, interests, and important dates for everyone in your network.
					</p>
				</div>
				<div class="p-6">
					<div class="text-4xl mb-4">💬</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">Stay Connected</h3>
					<p class="text-gray-600">
						Get reminders to follow up and never let a relationship go cold.
					</p>
				</div>
				<div class="p-6">
					<div class="text-4xl mb-4">📈</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">Build Stronger Bonds</h3>
					<p class="text-gray-600">
						Turn casual acquaintances into meaningful relationships through thoughtful engagement.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Pricing Section -->
	<section id="pricing" class="py-20 px-6 bg-gray-50">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<h2 class="text-4xl font-bold text-gray-900 mb-4">Pricing</h2>
				<p class="text-lg text-gray-600">Choose the plan that's right for you</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
				<!-- Free Tier -->
				<div class="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col">
					<div class="mb-6">
						<h3 class="text-2xl font-bold text-gray-900 mb-2">Free</h3>
						<p class="text-gray-600 mb-4">Discover the people person in you.</p>
						<div class="text-3xl font-bold text-gray-900">Free forever.</div>
					</div>

					<ul class="space-y-3 mb-8 flex-1">
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Track up to 20 friends</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Unlimited conversations</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Basic reminders</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Relationship health tracking</span>
						</li>
					</ul>

					<button
						onclick={() => scrollToSection('guides')}
						class="w-full px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Start for Free
					</button>
				</div>

				<!-- Pro Tier -->
				<div class="bg-white border-2 border-blue-500 rounded-2xl p-8 flex flex-col relative">
					<div class="absolute -top-4 left-1/2 -translate-x-1/2">
						<span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
							Popular
						</span>
					</div>

					<div class="mb-6">
						<h3 class="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
						<p class="text-gray-600 mb-4">
							Everything you need to win friends and influence people.
						</p>
						<div class="flex items-baseline gap-2">
							<span class="text-3xl font-bold text-gray-900">$20</span>
							<span class="text-gray-600">/mo</span>
						</div>
					</div>

					<p class="text-sm text-gray-900 mb-4">All Free features, plus:</p>

					<ul class="space-y-3 mb-8 flex-1">
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Unlimited people tracking</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Advanced analytics & insights</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Smart follow-up suggestions</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Calendar integrations</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Priority support</span>
						</li>
						<li class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span class="text-gray-900">Export & backup features</span>
						</li>
					</ul>

					<button
						onclick={() => scrollToSection('guides')}
						class="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
					>
						Upgrade now
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- Learn Section -->
	<section id="learn" class="py-20 px-6">
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<h2 class="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
				<p class="text-lg text-gray-600">
					Get started with PeoplePerson in three simple steps
				</p>
			</div>

			<div class="space-y-12">
				<div class="flex gap-6 items-start">
					<div
						class="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl"
					>
						1
					</div>
					<div>
						<h3 class="text-2xl font-semibold text-gray-900 mb-2">Choose Your Guide</h3>
						<p class="text-gray-600">
							Start by selecting Scout or Nico as your companion. They'll help you navigate the
							platform and make relationship management fun and intuitive.
						</p>
					</div>
				</div>

				<div class="flex gap-6 items-start">
					<div
						class="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl"
					>
						2
					</div>
					<div>
						<h3 class="text-2xl font-semibold text-gray-900 mb-2">Add Your People</h3>
						<p class="text-gray-600">
							Import contacts or add people manually. For each person, track conversations,
							interests, important dates, and any details that matter to you.
						</p>
					</div>
				</div>

				<div class="flex gap-6 items-start">
					<div
						class="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl"
					>
						3
					</div>
					<div>
						<h3 class="text-2xl font-semibold text-gray-900 mb-2">Stay Connected</h3>
						<p class="text-gray-600">
							PeoplePerson reminds you when it's time to follow up, celebrates important dates, and
							helps you maintain strong relationships with everyone who matters.
						</p>
					</div>
				</div>
			</div>

			<div class="mt-12 text-center">
				<button
					onclick={() => scrollToSection('guides')}
					class="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
				>
					Get Started Now
				</button>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-gray-200 py-8 px-6">
		<div class="max-w-6xl mx-auto text-center text-gray-600">
			<p>&copy; 2025 PeoplePerson. Built with care by Scout and Nico.</p>
		</div>
	</footer>
</div>
