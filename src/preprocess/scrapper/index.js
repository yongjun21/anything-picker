import fs from 'fs'
import axios from 'axios'
import cheerio from 'cheerio'
import {ThrottledQueue} from '../../helpers/util'
import {cleanWhiteSpace} from '../../helpers/text'

import data from '../../../data/childcare.json'

const queue = new ThrottledQueue(100)
const debug = []
const urls = data.slice(0, 10).map(f => f.properties.HYPERLINK)
const jobs = urls
  .map(url => url.slice(-6))
  .map((id, i) => queue.push(fetchCenterInfo, id, urls.length - i))

Promise.all(jobs).then(() => {
  if (debug.length > 0) console.log('Unsuccessfull:', debug)
})

function fetchCenterInfo (id, k) {
  if (k % 100 === 0) console.log(k)
  return axios({
    method: 'get',
    url: 'https://www.childcarelink.gov.sg/ccls/chdcentpart/ChdCentPartLnk.jsp',
    params: {centreCd: id},
    responseType: 'text'
  }).then(res => {
    const Cookie = res.headers['set-cookie'][0].match(/JSESSIONID=.*?;/)[0]
    return axios({
      method: 'get',
      url: 'https://www.childcarelink.gov.sg/ccls/chdcentpart/ChdCentPartLst.jsp',
      params: {centreCd: id},
      headers: {
        'Cookie': Cookie,
        'Referer': 'https://www.childcarelink.gov.sg/ccls/chdcentpart/ChdCentPartLnk.jsp?centreCd=' + id
      },
      responseType: 'text'
    })
  }).then(res => cheerio.load(res.data))
    .then(parseCenterInfo)
    .then(result => fs.writeFile(`data/raw/${id}.json`, JSON.stringify(result, null, '\t')))
    .catch(err => {
      debug.push(id)
      console.error(err.message)
    })
}

function parseCenterInfo ($) {
  const result = {}

  const $content = $('body > table > tbody > tr').eq(1)
  const $particulars = $content.find('table').first()
  const $otherTables = $('table.DETableWithBorder')
  const $contact = $otherTables.last()

  $particulars.find('tr').slice(2).each(function () {
    const $row = $(this).children()
    const key = $row.first().text().trim()
    const value = $row.last().text().trim()
    result[key] = value
  })

  $contact.find('tr').slice(1).each(function () {
    const $row = $(this).children()
    const key = $row.first().text().trim()
    const value = cleanWhiteSpace($row.last().text())
    result[key] = value
  })

  $otherTables.each(function () {
    const $table = $(this)
    const title = $table.prev().text().trim()
    if (title === 'Food') {
      result.food = {}
      $table.find('tr').slice(1).each(function () {
        const $row = $(this).children()
        const key = $row.first().text().trim()
        const value = cleanWhiteSpace($row.last().text())
        result.food[key] = value
      })
    } else if (title === 'Mother Tongue Offered') {
      result.motherTongue = {}
      $table.find('tr').slice(1).each(function () {
        const $row = $(this).children()
        const key = $row.first().text().trim()
        const value = cleanWhiteSpace($row.last().text())
        result.motherTongue[key] = value
      })
    } else if (title === 'Operating Hours') {
      result.operatingHours = {}
      $table.find('tr').slice(1).each(function () {
        const $row = $(this).children()
        const key = $row.first().text().trim()
        const fullDay = cleanWhiteSpace($row.eq(1).text())
        const am = cleanWhiteSpace($row.eq(2).text())
        const pm = cleanWhiteSpace($row.eq(3).text())
        result.operatingHours[key] = {
          'Full Day': fullDay,
          'AM': am,
          'PM': pm
        }
      })
    } else if (title === 'Type Of Services') {
      result.services = []
      $table.find('tr').slice(2).each(function () {
        const $row = $(this).children()
        const ageFrom = [
          cleanWhiteSpace($row.eq(1).text()),
          cleanWhiteSpace($row.eq(2).text())
        ].join(' ')
        const ageTo = [
          cleanWhiteSpace($row.eq(3).text()),
          cleanWhiteSpace($row.eq(4).text())
        ].join(' ')
        const type = cleanWhiteSpace($row.eq(5).text())
        const fee = +cleanWhiteSpace($row.eq(6).text())
        const feeWithGST = +cleanWhiteSpace($row.eq(6).text())
        result.services.push({
          'Age From': ageFrom,
          'Age To': ageTo,
          'Service Type': type,
          'Fee without GST': fee,
          'Fee with GST': feeWithGST
        })
      })
    }
  })

  return result
}
