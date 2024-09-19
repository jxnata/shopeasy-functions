import { Client, Databases, ID, Users } from 'node-appwrite'
import axios from 'axios'

const client = new Client()

client
	.setEndpoint(process.env.APPWRITE_ENDPOINT)
	.setProject(process.env.APPWRITE_PROJECT_ID)
	.setKey(process.env.APPWRITE_API_KEY)

const users = new Users(client)
const database = new Databases(client)

const ONE_DAY = 24 * 60 * 60 * 1000
const DAY_LIMIT = 1000

export default async ({ req, res, log, error }) => {
	try {
		const payload = JSON.parse(req.body)

		if (!payload.items) throw new Error('Invalid request: items is required')
		if (!payload.items.length) throw new Error('Empty list items')

		// ----------> Verify AI usage limit <----------
		// const userId = req.headers['x-appwrite-user-id']

		// if (!userId) throw new Error('Missing user ID')

		// const prefs = await users.getPrefs(userId)

		// let current = 0

		// if (prefs.ai_usage) {
		// 	current = prefs.ai_usage
		// 	const last_usage = prefs.last_usage || 0

		// 	if (last_usage < Date.now() - ONE_DAY) current = 0

		// 	if (current > DAY_LIMIT) throw new Error('AI usage limit exceeded')
		// }

		// ----------> Call OpenAI to get suggestions <----------

		const list = payload.items.join(', ')
		const prompt = `Given the following shopping list: ${list}, suggest 5 other items that might be useful to add to this list. Do not repeat the existing items. Return only the items, separated by commas. If you can't help me, just return the word ERROR.`

		const { data } = await axios.post(
			'https://api.openai.com/v1/chat/completions',
			{
				model: 'gpt-4o-mini',
				messages: [{ role: 'user', content: prompt }],
				max_tokens: 100,
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					'Content-Type': 'application/json',
				},
			}
		)

		// ----------> Validate OpenAI response <----------

		if (!data) throw new Error('Invalid response')
		if (!data.choices) throw new Error('No choices in response')
		if (!data.choices.length) throw new Error('Choices is empty')
		if (!data.choices[0].message) throw new Error('No message in choice')
		if (!data.choices[0].message.content) throw new Error('No content in message')

		// ----------> Save user preferences <----------

		// const usage = data.usage.total_tokens
		// users.updatePrefs(userId, { ai_usage: current + usage, last_usage: Date.now() })

		// ----------> Check violations <----------

		// if (data.choices[0].message.content.includes('ERROR')) {
		// 	await database.createDocument('production', 'violation', ID.unique(), {
		// 		user: userId,
		// 		content: list,
		// 	})

		// 	throw new Error('Explicit content')
		// }

		// ----------> Return suggestions <----------

		const suggestionsString = data.choices[0].message.content

		const suggestions = suggestionsString
			.split(',')
			.map((suggestion) => suggestion.trim())
			.filter((suggestion) => suggestion.length > 0)

		return res.send(suggestions)
	} catch (exception) {
		error(exception.toString())
		return res.send('Suggestion failed, please try again later.', 500)
	}
}
