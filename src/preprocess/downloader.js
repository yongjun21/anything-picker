import fs from 'fs'
import axios from 'axios'

Promise.all([
  downloadGeojson(),
  downloadCSV()
])

function downloadGeojson () {
  const unzip = require('unzip')
  const Zip = require('node-7z')
  const zip = new Zip()
  const shapefile = require('shapefile')

  const url = 'https://data.gov.sg/dataset/c985e771-8c39-4e4f-b472-00fd3d1bd6fd/resource/6774002d-9b5c-4d0b-8278-95c87dca76ad/download'

  return axios.get(url, {responseType: 'stream'}).then(res => {
    return new Promise((resolve, reject) => {
      res.data
        .pipe(unzip.Parse())
        .on('entry', entry => {
          if (entry.path === 'child-care-services-shp.zip') {
            entry
              .pipe(fs.createWriteStream('data/child-care-services-shp.zip'))
              .on('close', resolve)
              .on('error', reject)
          } else {
            entry.autodrain()
          }
        })
        .on('error', reject)
    })
  }).then(() => {
    zip.extractFull('data/child-care-services-shp.zip', 'data/shapefile')
    shapefile.read('data/shapefile/CHILDCARE.shp', 'data/shapefile/CHILDCARE.dbf')
      .then(geojson => {
        fs.writeFileSync('data/raw/geojson.json', JSON.stringify(geojson, null, '\t'))
      })
  })
}

function downloadCSV () {
  const url = 'https://data.gov.sg/api/action/datastore_search'

  const resources = {
    centres: '2d9b7f4d-744a-464c-b299-9f2c79bea968',
    services: '0123fd5c-6c74-40e8-a8ec-e450832e84df',
    licenseHistory: 'fd7a9017-2f55-47f6-ac5c-7ba7a695dede',
    incidentalCharges: 'b5cbdda7-5933-4244-ae89-e8b597850c11'
  }

  return Promise.all(Object.keys(resources).map(key => {
    return axios.get(url, {
      params: {
        resource_id: resources[key],
        limit: 1000000
      }
    }).then(res => res.data.result.records)
      .then(json => fs.writeFileSync(`data/raw/${key}.json`, JSON.stringify(json)))
  }))
}
