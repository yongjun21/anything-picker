const axios = require('axios')
const cheerio = require('cheerio')
const tableparser = require('cheerio-tableparser')
const {html2json} = require('html2json')

exports.scrapSpecialNeeds = function () {
  const url = 'https://www.moe.gov.sg/education/special-education/mainstream-schools'
  return axios.get(url, {responseType: 'text'})
    .then(res => cheerio.load(res.data))
    .then(parseSpecialNeeds)
    .catch(console.error)
}

function parseSpecialNeeds ($) {
  const result = {}

  function supportType (text) {
    if (/Hearing Loss.*Signing/.test(text)) return 'HL.Signing'
    if (/Hearing Loss.*Oral/.test(text)) return 'HL.Oral'
    if (/Visual Impairment/.test(text)) return 'VI'
  }

  const $table1 = $('#Provisions-and-Support-in-Mainstream-Schools')
    .nextAll('table').eq(0)
  const $table2 = $('#List-of-Mainstream-Primary-Schools-with-Barrier-Free-Accessibility')
    .nextAll('table').eq(0)
  const $table3 = $('#List-of-Mainstream-Secondary-Schools-and-Junior-Colleges-Centralised-Institute-with-Barrier-Free-Accessibility')
    .nextAll('table').eq(0)
  $table1.find('tr').slice(1).each(function () {
    const $tds = $(this).find('td')
    const group = $tds.eq(0).text().trim().replace(/\s+/g, ' ')
    const schools = $tds.eq(1).find('a').each(function () {
      const school = $(this).text().trim().toUpperCase()
      result[school] = result[school] || []
      result[school].push(supportType(group))
    })
  })
  $table2.find('tr').slice(1).each(function () {
    const $tds = $(this).find('td')
    const school = $tds.last().text().trim().toUpperCase()
    result[school] = result[school] || []
    result[school].push('PD')
  })
  $table3.find('tr').slice(1).each(function () {
    const $tds = $(this).find('td')
    const school = $tds.last().text().trim().toUpperCase()
    result[school] = result[school] || []
    result[school].push('PD')
  })
  return result
}

exports.scrapStudentCare = function () {
  const url = 'http://sis.moe.gov.sg/Pages/SchoolUpdates/SchoolBasedStudentCareCentres.aspx'
  return axios.get(url, {responseType: 'text'})
    .then(res => res.data)
    .then(html => {
      const table = html
        .replace(/\r?\n|\r/g, '').replace(/>\s+</g, '><')
        .match(/<table.*<\/table>/)[0]
      const json = html2json(table)
      return parseStudentCare(json)
    })
    .catch(console.error)
}

function parseStudentCare (table) {
  return table.child[0].child
    .filter(c => c.attr && c.attr.id && c.attr.id === 'schoolListContent')[0].child
    .map(c => c.child[0].child[0].child[0].text.toUpperCase())
}

exports.scrapRelocatedSchools = function () {
  const url = 'http://sis.moe.gov.sg/Pages/SchoolUpdates/RelocatedSchools.aspx'
  return axios.get(url, {responseType: 'text'})
    .then(res => res.data)
    .then(html => {
      const table = html
        .replace(/\r?\n|\r/g, '').replace(/>\s+</g, '><')
        .match(/<table.*<\/table>/)[0]
      const json = html2json(table)
      return parseRelocatedSchools(json)
    })
    .catch(console.error)
}

function parseRelocatedSchools (table) {
  const rows = table.child[0].child
    .filter(c => c.attr && c.attr.class === 'moeContentRow')
    .map(c => c.child
      .map(c => c.child
        .filter(c => c.tag !== 'br')
      )
    )

  return rows.map(c => {
    const array = []
    array[0] = c[0][0].child[0].text
    array[1] = c[0][1].child.filter(c => c.node === 'text').map(c => c.text).join().replace(/^\s+|\s+$/g, '')
    array[2] = c[1].filter(c => c.node === 'text').map(c => c.text).join().trim()
    array[3] = c[2][0].text
    return array
  })
}

exports.scrapMergerSchools = function () {
  const url = 'http://sis.moe.gov.sg/Pages/SchoolUpdates/MergerSchools.aspx'
  return axios.get(url, {responseType: 'text'})
    .then(res => res.data)
    .then(html => {
      const table = html
        .replace(/\r?\n|\r/g, '').replace(/>\s+</g, '><')
        .match(/<table.*<\/table>/)[0]
      const json = html2json(table)
      return parseMergerSchools(json)
    })
    .catch(console.error)
}

function parseMergerSchools (table) {
  const rows = table.child[0].child
    .filter(c => c.attr && c.attr.class === 'moeContentRow')
    .map(c => c.child
      .map(c => c.child))

  const parsedSchools = rows.map(c => {
    const array = []
    array[0] = c[0][0].text
    array[1] = c[1][0].text
    array[2] = c[2].filter(c => c.node === 'text').map(c => c.text.replace(/^\s+|\s+$/g, '')).join()
    array[3] = c[3][0].text

    return array
  })

  return parsedSchools
}

exports.scrapNewSchools = function () {
  const url = 'http://sis.moe.gov.sg/Pages/SchoolUpdates/NewSchools.aspx'
  return axios.get(url, {responseType: 'text'})
    .then(res => res.data)
    .then(html => {
      const table = html
        .replace(/\r?\n|\r/g, '').replace(/>\s+</g, '><')
        .match(/<table.*<\/table>/)[0]
      const json = html2json(table)
      return parseNewSchools(json)
    })
    .catch(console.error)
}

function parseNewSchools (table) {
  return table.child[0].child
    .filter(c => c.attr && c.attr.class === 'moeContentRow')
    .map(c => c.child
      .map(c => c.child[0].text)
    )
}

exports.scrapVacancies = function () {
  const url = 'https://www.moe.gov.sg/admissions/primary-one-registration/vacancies'
  return axios.get(url, {responseType: 'text'})
    .then(res => cheerio.load(res.data))
    .then(parseVacancies)
    .catch(console.error)
}

function parseVacancies ($) {
  tableparser($)
  const table = $('table').parsetable(true, true, true)
  const result = {}
  table.splice(0, 1)
  table.splice(1, 3)
  const headers = table.map(col => removeArtifacts(col[0]).toUpperCase()).slice(1)
  const [first, ...rest] = table
  first.forEach((v, i) => {
    if (i < 2) return
    const school = removeArtifacts(v).toUpperCase()
    const row = {}
    headers.forEach((key, j) => {
      row[key] = +removeArtifacts(rest[j][i])
    })
    result[school] = row
  })
  return result
}

function removeArtifacts (str) {
  return str.trim().replace(/&nbsp;/g, '').replace(/\u200b/g, '').replace(/\s\s+/g, ' ')
}

// https://www.moe.gov.sg/admissions/primary-one-registration/balloting
