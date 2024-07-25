const sdk = require('node-appwrite')

const client = new sdk.Client()

client
	.setEndpoint(process.env.APPWRITE_ENDPOINT)
	.setProject(process.env.APPWRITE_PROJECT_ID)
	.setKey(process.env.APPWRITE_API_KEY)

const database = new sdk.Databases(client)

const create_event = /^databases\.production\.collections\.items\.documents\.[a-zA-Z0-9]+\.(create)$/
const delete_event = /^databases\.production\.collections\.items\.documents\.[a-zA-Z0-9]+\.(delete)$/

module.exports = async function (req, res, log, error) {
	const payload = req.body
	log(payload)
	const listId = payload.list.$id
	const event = req.headers['x-appwrite-event']

	try {
		const list = await database.getDocument('production', 'lists', listId)

		let count = list.count + 1

		if (create_event.test(event)) {
			count += 1
		} else if (delete_event.test(event)) {
			count -= 1
		}

		if (count < 0) return res.send('count cannot be less than 0', 400)

		await database.updateDocument('production', 'lists', listId, { count })

		res.send(`count for list ${listId} incremented to: ` + count)
	} catch (exception) {
		error(exception)
		res.send('error incrementing count', 500)
	}
}
