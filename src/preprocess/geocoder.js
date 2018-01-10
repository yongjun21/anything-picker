import fs from 'fs'
import axios from 'axios'
import {CustomHeatmap} from '../helpers/geospatial'

// geocode()
// getPlanningArea()

export function geocode () {
  const filenames = fs.readdirSync('data/raw')
    .filter(file => file.match(/\.json$/))

  const apiCalls = {
    delay: 50,
    queue: Promise.resolve(),
    push (url, options) {
      this.queue = this.queue.then(() => {
        return new Promise((resolve, reject) => {
          setTimeout(resolve, this.delay, axios.get(url, options))
        })
      })
      return this.queue
    }
  }

  const locations = {}

  Promise.all(filenames.map(filename => {
    let clinic = require('../../data/raw/' + filename)
    const postalCode = clinic.address.match(/\d{6}$/)[0]
    return apiCalls.push('https://developers.onemap.sg/commonapi/search', {
      params: {
        searchVal: postalCode,
        returnGeom: 'Y',
        getAddrDetails: 'Y',
        pageNum: 1
      }
    }).then(res => {
      const match = res.data.results[0]
      if (match) {
        locations[clinic.hciCode] = {
          coordinates: [+match.LONGITUDE, +match.LATITUDE],
          svy21: [+match.X, +match.Y]
        }
      } else {
        console.log('Not found:', filename)
      }
    })
    .catch(console.error)
  })).then(() => {
    fs.writeFileSync('data/locations.json', JSON.stringify(locations, null, '\t'))
  })
}

export function getPlanningArea () {
  const locations = require('../../data/locations.json')
  const heatmap = new CustomHeatmap()
  Object.keys(locations).forEach(clinic => {
    locations[clinic].coordinates = locations[clinic].coordinates.map(v => +v.toFixed(7))
    locations[clinic].svy21 = locations[clinic].svy21.map(v => +v.toFixed(2))

    const match = heatmap.bin(locations[clinic].coordinates)[0]
    if (match) {
      locations[clinic].planningArea = match.id
      locations[clinic].neighbours = match.properties.neighbours
    } else {
      console.log('Not found:', clinic)
    }
  })

  fs.writeFileSync('data/locations.json', JSON.stringify(locations))
}
