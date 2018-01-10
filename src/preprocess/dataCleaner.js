import fs from 'fs'
import axios from 'axios'
import _groupBy from 'lodash/groupBy'
import _omit from 'lodash/omit'
import _pick from 'lodash/pick'
import {fromSVY21} from 'sg-heatmap/dist/helpers/geometry'

import {CustomHeatmap} from '../helpers/geospatial'

import centres from '../../data/raw/centres.json'
import geojson from '../../data/raw/geojson.json'

const toOmit = ['_id', 'centre_code', 'centre_name']
function discardRepeats (row) {
  return _omit(row, toOmit)
}

geojson.features.forEach(feature => {
  feature.id = feature.properties.HYPERLINK.slice(-6)
})

const services = _groupBy(require('../../data/raw/services.json'), 'centre_code')
const licenseHistory = _groupBy(require('../../data/raw/licenseHistory.json'), 'centre_code')
const incidentalCharges = _groupBy(require('../../data/raw/incidentalCharges.json'), 'centre_code')

const jobs = centres.map(raw => {
  const processed = Object.assign({}, raw)
  delete processed._id

  const id = raw.centre_code

  Object.keys(processed).forEach(key => {
    if (processed[key] === 'na') processed[key] = null
    if (processed[key] === 'Yes') processed[key] = true
    if (processed[key] === 'No') processed[key] = false
  })

  processed.id = id
  processed['service_listing'] = services[id] && services[id].map(discardRepeats)
  processed['license_history'] = licenseHistory[id] && licenseHistory[id].map(discardRepeats)
  processed['incidental_charges'] = incidentalCharges[id] && incidentalCharges[id].map(discardRepeats)

  const match = geojson.features.find(feature => feature.id === id)

  if (match) {
    processed.svy21 = match.geometry.coordinates
    processed.coordinates = fromSVY21(match.geometry.coordinates)
    return processed
  } else {
    const postalCode = ('000000' + raw.postal_code).slice(-6)
    return axios.get('https://developers.onemap.sg/commonapi/search', {
      params: {
        searchVal: postalCode,
        returnGeom: 'Y',
        getAddrDetails: 'Y',
        pageNum: '1'
      }
    }).then(res => res.data)
      .then(json => {
        const match = json.results[0]
        if (match) {
          processed.svy21 = [+match.X, +match.Y]
          processed.coordinates = [+match.LONGITUDE, +match.LATITUDE]
        } else {
          console.log('Coordinates not found:', id)
        }
        return processed
      })
  }
})

Promise.all(jobs).then(result => {
  const heatmap = new CustomHeatmap()
  const locations = {}
  result.forEach(processed => {
    if (processed.coordinates) {
      processed.coordinates = processed.coordinates.map(v => +v.toFixed(7))
      processed.svy21 = processed.svy21.map(v => +v.toFixed(2))
      const match = heatmap.bin(processed.coordinates)[0]
      if (match) {
        processed.planningArea = match.id
        processed.neighbours = match.properties.neighbours
      }
    }
    locations[processed.id] = _pick(processed, [
      'coordinates',
      'svy21',
      'planningArea',
      'neighbours'
    ])
    fs.writeFileSync(`public/data/centres/${processed.id}.json`, JSON.stringify(processed, null, 2))
  })
  fs.writeFileSync('data/locations.json', JSON.stringify(locations))
})
