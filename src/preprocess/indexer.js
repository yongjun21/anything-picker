import fs from 'fs'

import featureExtractor from './featureExtractor'
import {generateForwardIndex} from '../helpers/search'

indexSchoolData()

export function indexSchoolData () {
  const forwardIndex = generateForwardIndex(featureExtractor, [
    'name',
    'contactNo',
    'email',
    'website',
    'schemeType',
    'sparkCertified',
    'iccp',
    'secondLanguage',
    'vegetarian',
    'beef',
    'halal',
    'services',
    'coordinates',
    'svy21',
    'planningArea'
  ])

  const result = []
  Object.keys(forwardIndex).forEach(key => {
    forwardIndex[key].id = key
    result.push(forwardIndex[key])
  })

  fs.writeFileSync('public/entityList.json', JSON.stringify(result))
  return result
}
