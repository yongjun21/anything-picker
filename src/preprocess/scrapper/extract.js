import Zip from 'node-7z'
import fs from 'fs'

const shapefile = require('shapefile')
const zip = new Zip()

zip.extractFull('data/child-care-services-shp.zip', 'data/shapefile')

shapefile.read('data/shapefile/CHILDCARE.shp', 'data/shapefile/CHILDCARE.dbf')
  .then(geojson => {
    fs.writeFile('data/childcare.json', JSON.stringify(geojson.features, null, '\t'))
  })
