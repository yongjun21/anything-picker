const fs = require('fs')
const _range = require('lodash/range')
const _max = require('lodash/max')
const scrap = require('./scrapper')
const aggregate = require('./aggregator')
const runTask = require('./task-runner')
const {
  scrapSpecialNeeds,
  scrapRelocatedSchools,
  scrapMergerSchools,
  scrapNewSchools,
  scrapStudentCare,
  scrapVacancies
} = require('./additionalScrappers')

const {defaultYearRange} = require('./constants')

// scrap('', {schoolCode: '1759'})
//   .then(json => {
//     fs.writeFileSync('data/tmp.json', JSON.stringify(json, null, '\t'))
//   })

// scrapSpecialNeeds().then(json => {
//   fs.writeFileSync('data/specialNeeds.json', JSON.stringify(json, null, '\t'))
// })

// scrapStudentCare().then(json => {
//   fs.writeFileSync('data/studentCare.json', JSON.stringify(json, null, '\t'))
// })

scrapVacancies().then(vacancies => {
  const now = new Date()
  now.setHours(now.getHours() + 8)
  const suffix = '_' + now.toISOString().slice(0, 10)
  fs.writeFileSync('data/vacancies.json', JSON.stringify(vacancies, null, '\t'))
  fs.writeFileSync(`data/backups/vacancies${suffix}.json`, JSON.stringify(vacancies, null, '\t'))
})

// runTask([], defaultYearRange)
