import axios from 'axios'

export default async ({ req, res, log, error }) => {
	try {
		const payload = req.body
		const searchQuery = payload.search + '.json'
		const uri = 'https://api.tomtom.com/search/2/search/' + searchQuery
		log(uri)
		const response = await axios.get(uri, {
			params: {
				key: process.env.TOMTOM_API_KEY,
				typeahead: true,
				limit: 5,
				lat: payload.latitude,
				lon: payload.longitude,
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
