import axios from 'axios'

export default async ({ req, res, log, error }) => {
	try {
		log(req.body.term)
		if (!req.body.term || !req.body.latitude || !req.body.longitude) {
			error('missing required parameters')
			return res.send('missing required parameters', 400)
		}

		const response = await axios.get(`https://api.tomtom.com/search/2/search/${req.body.term}.json`, {
			params: {
				key: process.env.TOMTOM_API_KEY,
				typeahead: true,
				limit: 5,
				lat: req.body.latitude,
				lon: req.body.longitude,
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
