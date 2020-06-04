import fs from 'fs'
import axios from 'axios'
import {CustomHeatmap} from '../helpers/geospatial'
import {onemapApi} from '../helpers/api'

// geocode()
// getPrimarySchoolLocations()
getPlanningArea()

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
    let school = require('../../data/raw/' + filename)
    return apiCalls.push('https://developers.onemap.sg/commonapi/search', {
      params: {
        searchVal: school.postalCode,
        returnGeom: 'Y',
        getAddrDetails: 'Y',
        pageNum: 1
      }
    }).then(res => res.data)
      .then(json => {
        const match = json.results.find(address =>
          normalize(school.name) === normalize(address.BUILDING))
        if (match) {
          locations[school.code] = {
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

function normalize (str) {
  return str.toLowerCase()
    .replace(/saint/g, 'st.')
    .replace(/government/g, 'govt.')
}

export function getPrimarySchoolLocations () {
  function fetchSchools (token) {
    const url = 'https://developers.onemap.sg/publicapi/schooldataAPI/retrieveAllSchools?token=' + token
    return axios.get(url).then(res => res.data).then(json => {
      if (!('SearchResults' in json)) throw new Error()
      return json.SearchResults.slice(1)
    })
  }

  onemapApi(fetchSchools).then(data => {
    const locations = require('../../data/locations.json')
    const schoolList = require('../../data/schoolList.json')

    data.forEach(location => {
      const match = schoolList.find(school => school.name === location.SCHOOLNAME)
      if (!match) return
      const coordinates = [+location.LONGITUDE, +location.LATITUDE]
      const svy21 = [+location.SCH_X_ADDR, +location.SCH_Y_ADDR]
      locations[match.code] = {coordinates, svy21}
    })

    fs.writeFileSync('data/locations.json', JSON.stringify(locations, null, '\t'))
  }).catch(console.error)
}

export function getPlanningArea () {
  const locations = require('../../data/locations.json')
  const heatmap = new CustomHeatmap()

  Object.keys(locations).forEach(school => {
    locations[school].coordinates = locations[school].coordinates.map(v => +v.toFixed(7))
    locations[school].svy21 = locations[school].svy21.map(v => +v.toFixed(2))
    const matches = heatmap.bin(locations[school].coordinates)
    locations[school].planningArea = matches[0].id
    locations[school].neighbours = matches[0].properties.neighbours
  })

  fs.writeFileSync('data/locations.json', JSON.stringify(locations))
}
