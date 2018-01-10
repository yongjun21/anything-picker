import fs from 'fs'
import axios from 'axios'
import cheerio from 'cheerio'
import {ThrottledQueue} from '../../helpers/util'

import {clinic as clinicList} from '../../../data/clinicList.json'

const queue = new ThrottledQueue(100)
const debug = []
const clinicSubset = clinicList.slice(4000, 5000)
const jobs = clinicSubset
  .map((id, i) => queue.push(fetchClinicInfo, id, clinicSubset.length - i))

Promise.all(jobs).then(() => {
  if (debug.length > 0) console.log('Unsuccessfull:', debug)
})

function fetchClinicInfo (id, k) {
  if (k % 100 === 0) console.log(k)
  return axios({
    method: 'get',
    url: 'http://hcidirectory.sg/hcidirectory/clinic.do',
    params: {
      pkId: id,
      task: 'view'
    },
    responseType: 'text'
  }).then(res => cheerio.load(res.data))
    .then(parseClinicInfo)
    .then(result => {
      fs.writeFileSync(`data/raw/${id}.json`, JSON.stringify(result, null, '\t'))
    })
    .catch(err => {
      debug.push(id)
      console.error(err.message)
    })
}

function parseClinicInfo ($) {
  const result = {}
  result.name = $('.left_col > h1').text().trim()

  const first3rows = $('.left_col > table').first().find('tr')
  try {
    result.tel = first3rows.eq(0).find('td').eq(0).html().match(/(\d{8})/)[1]
    result.fax = first3rows.eq(1).find('td').eq(0).html().match(/(\d{8})/)[1]
  } catch (err) {
    // ignore
  }
  result.licensee = first3rows.eq(0).find('td').eq(2).text().trim()
  result.licensePeriod = first3rows.eq(1).find('td').eq(2).contents()[0].data.trim()
  result.licenseClass = first3rows.eq(1).find('td').eq(2).children('a').text()
  result.hciCode = first3rows.eq(2).find('td').eq(2).text().trim()

  result.address = $('.address p').contents()
    .filter((i, e) => e.type === 'text')
    .map((i, e) => e.data.trim().replace(/\s\s+/g, ' ')).get()
    .join(', ')

  $('.heading').each(function () {
    if ($(this).children('h2').text().match(/In Charge$/i)) {
      result.doctorInCharge = []
      $(this).next('table').find('tr').slice(1)
        .each(function () {
          const doctor = {}
          const $tds = $(this).children()
          doctor.name = $tds.eq(0).text().trim()
          doctor.qualifications = $tds.eq(1).children('li').map((i, e) => $(e).text()).get()
          doctor.specialties = $tds.eq(2).children('li').map((i, e) => $(e).text()).get()
          doctor.specialties = doctor.specialties.filter(v => v.length > 0)
          result.doctorInCharge.push(doctor)
        })
    } else if ($(this).children('h2').text() === 'Details of Services') {
      result.detailedServices = {}
      $(this).next('table').find('td').contents()
        .filter((i, e) => e.type === 'text' && e.data.trim().length > 0)
        .each(function () {
          const key = this.data.trim()
          if ($(this).next().next('ul').length > 0) {
            const value = []
            $(this).nextAll('ul').eq(0).children().each((i, e) => {
              value.push($(e).text())
            })
            result.detailedServices[key] = value
          } else {
            result.detailedServices[key] = true
          }
        })
    } else if ($(this).children('h2').text() === 'Special Services approved by MOH') {
      result.mohApprovedSpecialServices = []
      $(this).next('table').find('td').contents()
        .filter((i, e) => e.type === 'text' && e.data.trim().length > 0)
        .each((i, e) => {
          result.mohApprovedSpecialServices.push(e.data.trim())
        })
    } else if ($(this).children('h2').text() === 'Programmes') {
      result.programmes = []
      $(this).next('table').find('td').children('a')
        .each((i, e) => {
          result.programmes.push($(e).text())
        })
    } else if ($(this).children('h2').text() === 'Operating Hours') {
      result.operatingHours = {}
      const operatingHours = $(this).next('table').find('td').contents()
      operatingHours.each((i, e) => {
        if (e.name !== 'strong') return
        const $e = $(e)
        const key = $e.text()
        const value = operatingHours[i + 1].data.slice(2).trim()
        result.operatingHours[key] = value
      })
    }
  })

  return result
}
