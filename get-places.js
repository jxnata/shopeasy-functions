import axios from 'axios'

export default async ({ req, res, log, error }) => {
	try {
		const { term, latitude, longitude } = req.body
		log(term, latitude, longitude)

		if (!term || !latitude || !longitude) {
			return res.status(400).json({ error: 'missing required parameters' })
		}

		const response = await axios.get(`https://api.tomtom.com/search/2/search/${term}.json`, {
			params: {
				key: process.env.TOMTOM_API_KEY,
				typeahead: true,
				limit: 5,
				lat: latitude,
				lon: longitude,
			},
		})

		const locations = response.data.results.map((location) => ({
			place: location.id,
			name: location.poi.name,
			address: location.address.freeformAddress,
			lat: location.position.lat,
			lon: location.position.lon,
		}))

		return res.json(locations)
	} catch (exception) {
		error(exception)
		return res.send('search location error', 500)
	}
}

const j = {
	term: 'coob',
	latitude: -11.3014048,
	longitude: -41.8648057,
}
