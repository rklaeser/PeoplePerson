interface ProfilePicPosition {
	backgroundPosition: string;
	backgroundSize: string;
}

export function getProfilePicPosition(index: number, size: number = 64): ProfilePicPosition {
	// Assuming 5x5 grid (25 total images)
	const GRID_SIZE = 5;
	const BASE_ICON_SIZE = 64; // Base size of each icon in the sprite sheet

	// Calculate row and column from index
	const row = Math.floor(index / GRID_SIZE);
	const col = index % GRID_SIZE;

	// Scale factor for the desired size
	const scaleFactor = size / BASE_ICON_SIZE;

	// Calculate scaled sprite sheet total size
	const scaledSpriteSize = GRID_SIZE * BASE_ICON_SIZE * scaleFactor;

	// Calculate background position (scaled)
	const x = -(col * BASE_ICON_SIZE * scaleFactor);
	const y = -(row * BASE_ICON_SIZE * scaleFactor);

	return {
		backgroundPosition: `${x}px ${y}px`,
		backgroundSize: `${scaledSpriteSize}px ${scaledSpriteSize}px`
	};
}

export function getRandomProfilePicIndex(): number {
	return Math.floor(Math.random() * 25);
}
