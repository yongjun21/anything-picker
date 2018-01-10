import axios from 'axios'
import fs from 'fs'
import querystring from 'querystring'
import _range from 'lodash/range'

import {ThrottledQueue} from '../helpers/util'

const batchSize = 10

const endpoints = {
  clinic: 4128,
  hospital: 35,
  nursing: 77,
  laboratory: 212
}

const queue = new ThrottledQueue(100)

const tasks = Object.keys(endpoints).map(ep => {
  function fetchPage (pageNo) {
    return axios({
      method: 'post',
      url: `http://hcidirectory.sg/hcidirectory/${ep}.do`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: querystring.stringify({
        task: 'search',
        clinicType: 'all',
        hciTyp: 'all',
        targetPageNo: pageNo
      }),
      responseType: 'text'
    }).then(res => {
      const matches = res.data.match(/<a href="\/hcidirectory.*?task=view">/g) || []
      return matches
        .filter(s => s.indexOf('pkId') > -1)
        .map(s => s.match(/pkId=(.*?)&/)[1])
    }).catch(err => {
      queue.error = err
      throw err
    })
  }

  function batchFetch (batchNo) {
    return Promise.all(_range(batchSize).map(i => fetchPage(batchNo * batchSize + i + 1)))
      .then(results => results.reduce((a, v) => a.concat(v), []))
  }

  const batchCount = Math.ceil(endpoints[ep] / batchSize / 10)
  return Promise.all(_range(batchCount).map(i => queue.push(batchFetch, i)))
    .then(results => results.reduce((a, v) => a.concat(v), []))
})

Promise.all(tasks)
  .then(results => {
    const merged = {}
    Object.keys(endpoints).forEach((ep, i) => {
      merged[ep] = results[i]
    })
    fs.writeFileSync('data/clinicList.json', JSON.stringify(merged))
  })
  .catch(console.error)
