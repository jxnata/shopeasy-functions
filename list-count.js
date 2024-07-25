const sdk = require('node-appwrite')

const client = new sdk.Client()

client
	.setEndpoint(process.env.APPWRITE_ENDPOINT)
	.setProject(process.env.APPWRITE_PROJECT_ID)
	.setKey(process.env.APPWRITE_API_KEY)

const database = new sdk.Databases(client)

module.exports = async function (req, res) {
	const payload = JSON.parse(req.payload)
	const listId = payload.document.list

	try {
		const list = await database.getDocument('production', 'lists', listId)

		let count = list.count + 1

		if (req.events.includes('databases.*.collections.items.documents.*.create')) {
			count += 1
		} else if (req.events.includes('databases.*.collections.items.documents.*.delete')) {
			count -= 1
		}

		if (count < 0) return res.send('count cannot be less than 0', 400)

		await database.updateDocument('production', 'lists', listId, { count })

		res.send(`count for list ${listId} incremented to: ` + count)
	} catch (error) {
		console.error(error)
		res.send('error incrementing count', 500)
	}
}
