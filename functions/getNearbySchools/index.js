const axios = require('axios')
const {onemapApi} = require('./helpers')

const schoolList = require('./schoolList.json')

exports.handler = async function (event, context) {
  const result = await onemapApi(function (token) {
    const params = Object.assign({token}, event.queryStringParameters)
    const url = 'https://developers.onemap.sg/publicapi/schooldataAPI/querySchools'
    return axios.get(url, {params})
      .then(res => res.data)
      .then(json => {
        if (json.error) throw new Error(json.error)
        const results = json.SearchResults
        const oneKm = []
        const twoKm = []
        results.forEach(match => {
          if (!match.SCHOOLNAME) return
          const school = schoolList.find(row => row.name.toUpperCase() === match.SCHOOLNAME.toUpperCase())
          if (school) {
            if (match.DIST_CODE === '1') oneKm.push(school.id)
            else if (match.DIST_CODE === '2') twoKm.push(school.id)
          }
        })
        return {oneKm, twoKm}
      })
  })
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({query: event.queryStringParameters, result})
  }
}
