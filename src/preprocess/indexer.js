import fs from 'fs'

import featureExtractor from './featureExtractor'
import {generateForwardIndex} from '../helpers/search'

indexSchoolData()

export function indexSchoolData () {
  const forwardIndex = generateForwardIndex(featureExtractor, [
    'name',
    'phone',
    'address',
    'coordinates',
    'svy21',
    'planningArea'
  ])

  const result = []
  Object.keys(forwardIndex).forEach(key => {
    forwardIndex[key].id = key
    result.push(forwardIndex[key])
  })

  fs.writeFileSync('public/data/entityList.json', JSON.stringify(result))
  return result
}
