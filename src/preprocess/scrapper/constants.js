const _range = require('lodash/range')

exports.defaultYearRange = _range(2005, 2021).map(v => v.toString())
