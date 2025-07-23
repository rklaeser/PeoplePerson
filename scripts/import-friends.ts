#!/usr/bin/env tsx

// Import script for friends from JSON file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PersonService } from './src/lib/services/personService.server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_ID = 'b5dfb316-f9dc-4d36-8d32-cd098f6f9339';

// Read the JSON file
const friendsData = JSON.parse(
	fs.readFileSync(path.join(__dirname, 'static', 'Download friends.json'), 'utf8')
);

// Map JSON intent values to database enum values
const intentMapping = {
	Develop: 'invest',
	Core: 'core',
	Past: 'archive',
	Hold: 'archive'
};

// Clean and validate the data
const cleanedFriends = friendsData
	.filter((friend) => friend.name && friend.name.trim() !== '' && friend.name !== 'Name')
	.map((friend) => {
		// Handle NaN values in mnemonic
		let mnemonic = friend.mnemonic;
		if (mnemonic === 'NaN' || (typeof mnemonic === 'number' && isNaN(mnemonic))) {
			mnemonic = null;
		}

		// Map intent to database enum
		let intent = friend.intent;
		if (intent === 'NaN' || (typeof intent === 'number' && isNaN(intent)) || !intent) {
			intent = 'new'; // Default intent
		} else {
			intent = intentMapping[intent] || 'new';
		}

		// Clean up name (remove trailing whitespace/newlines)
		const name = friend.name.trim();

		return {
			name,
			mnemonic,
			intent,
			userId: USER_ID
		};
	});

console.log(`Processing ${cleanedFriends.length} friends to import...`);

// Import function
async function importFriends() {
	try {
		let successCount = 0;
		let errorCount = 0;

		for (const friend of cleanedFriends) {
			try {
				const result = await PersonService.createFriend(friend);
				if (result) {
					successCount++;
					console.log(`✓ Imported: ${friend.name}`);
				} else {
					errorCount++;
					console.log(`✗ Failed: ${friend.name}`);
				}
			} catch (error) {
				errorCount++;
				console.log(`✗ Error importing ${friend.name}:`, error.message);
			}
		}

		console.log(`\nImport completed:`);
		console.log(`- Successfully imported: ${successCount}`);
		console.log(`- Failed: ${errorCount}`);
		console.log(`- Total processed: ${cleanedFriends.length}`);
	} catch (error) {
		console.error('Import failed:', error);
	}
}

// Show preview first
console.log(`\nPreview of friends to import:`);
cleanedFriends.slice(0, 5).forEach((friend) => {
	console.log(
		`- ${friend.name} (${friend.intent}) ${friend.mnemonic ? `"${friend.mnemonic}"` : ''}`
	);
});
if (cleanedFriends.length > 5) {
	console.log(`... and ${cleanedFriends.length - 5} more`);
}

console.log(`\nStarting import for user: ${USER_ID}`);
importFriends();
