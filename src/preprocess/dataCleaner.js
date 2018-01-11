import fs from 'fs'

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Public Holiday'
]

const files = fs.readdirSync('data/raw').filter(file => file.match(/\.json$/))
const locations = require('../../data/locations.json')

files.forEach(file => {
  try {
    const raw = require('../../data/raw/' + file)

    const processed = Object.assign({}, raw)

    processed.id = raw.hciCode

    if (!raw.licenseClass) {
      const [licensePeriod, licenseClass] = raw.licensePeriod.split(/[\n\t]+/)
      processed.licensePeriod = licensePeriod
      processed.licenseClass = licenseClass
    }

    if (raw.operatingHours) {
      processed.operatingHours = cleanOperatingHours(raw.operatingHours)
    }

    const location = locations[processed.id]
    Object.assign(processed, location)

    fs.writeFileSync(`public/data/entities/${processed.id}.json`, JSON.stringify(processed, null, '\t'))
  } catch (err) {
    console.log('Bad record', file)
    throw err
  }
})

function cleanOperatingHours (input) {
  const output = {}
  Object.keys(input).forEach(key => {
    const value = input[key]
    let splitted = key.split(' and ')
    if (splitted.length > 1) {
      splitted.forEach(day => {
        output[day] = value
      })
    } else {
      splitted = splitted[0].split(' to ')
      if (splitted.length > 1) {
        const indexStart = DAYS_OF_WEEK.indexOf(splitted[0])
        const indexEnd = DAYS_OF_WEEK.indexOf(splitted[1])
        for (let i = indexStart; i <= indexEnd; i++) {
          output[DAYS_OF_WEEK[i]] = value
        }
      } else {
        output[key] = value
      }
    }
  })
  return output
}
