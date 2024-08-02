import axios from 'axios'

export default async ({ req, res, log, error }) => {
	try {
		const { term, latitude, longitude } = req.body

		if (!term || !latitude || !longitude) {
			return res.send('missing required parameters', 400)
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
		log(locations)
		return res.send(locations)
	} catch (exception) {
		error(exception)
		return res.send('search location error', 500)
	}
}
