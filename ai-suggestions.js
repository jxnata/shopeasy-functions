import axios from 'axios'

export default async ({ req, res, log, error }) => {
	try {
		const payload = JSON.parse(req.body)

		if (!payload.items) throw new Error('Invalid request: items is required')
		if (!payload.items.length) throw new Error('Empty list items')

		// ----------> Call OpenAI to get suggestions <----------

		const list = payload.items.join(', ')
		const prompt = `Given the following shopping list: ${list}, suggest 10 other items that might be useful to add to this list. Do not repeat the existing items. Return only the items, separated by commas.`
		log(prompt)
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

		log(data)
		// ----------> Validate OpenAI response <----------

		if (!data) throw new Error('Invalid response')
		if (!data.choices) throw new Error('No choices in response')
		if (!data.choices.length) throw new Error('Choices is empty')
		if (!data.choices[0].message) throw new Error('No message in choice')
		if (!data.choices[0].message.content) throw new Error('No content in message')

		const suggestionsString = data.choices[0].message.content

		const suggestions = suggestionsString
			.split(',')
			.map((suggestion) => suggestion.trim())
			.filter((suggestion) => suggestion.length > 0)

		return res.send(suggestions)
	} catch (exception) {
		error(exception)
		return res.send('Suggestion failed, please try again later.', 500)
	}
}
