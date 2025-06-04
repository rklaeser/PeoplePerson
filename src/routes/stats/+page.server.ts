import { Person, sequelize } from '$lib/db/models';
import { fail } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { Op } from 'sequelize';

export async function load() {
	try {
		// Get total counts by intent
		const intentStats = await Person.findAll({
			attributes: [
				'intent',
				[sequelize.fn('COUNT', sequelize.col('id')), 'count'],
				[
					sequelize.literal(`COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')`),
					'recentCount'
				]
			],
			group: ['intent']
		});

		// Transform the data to match the expected format
		const result = intentStats.map(stat => ({
			intent: stat.getDataValue('intent'),
			count: parseInt(stat.getDataValue('count')),
			recentCount: parseInt(stat.getDataValue('recentCount'))
		}));

		return { intents: result };
	} catch (error) {
		console.error('API GET Error:', error);
		throw new Error('Failed to fetch intent statistics');
	}
}