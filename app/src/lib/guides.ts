import type { Guide, GuideType } from './types';

export const GUIDES: Record<GuideType, Guide> = {
	Scout: {
		type: 'Scout',
		name: 'Scout',
		imageUrl: '/scout.png',
		bio: "Bark! I'm Scout, your loyal companion on this journey. I'm so excited to help you remember everyone!",
		personality: 'Enthusiastic, loyal, always excited to help'
	},
	Nico: {
		type: 'Nico',
		name: 'Nico',
		imageUrl: '/nico.png',
		bio: "Meow. I'm Nico, your strategic advisor. Together we shall build an empire of meaningful connections.",
		personality: 'Strategic, ambitious, sophisticated'
	}
};

export function getGuide(type: GuideType): Guide {
	return GUIDES[type];
}
