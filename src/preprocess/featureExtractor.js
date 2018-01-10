export default {
  name (json) {
    return json.name
  },

  phone (json) {
    return json.tel
  },

  fax (json) {
    return json.fax
  },

  address (json) {
    return json.address
  },

  services (json) {
    const count = {}
    const detailedServices = json.detailedServices || {}
    Object.keys(detailedServices).forEach(key => {
      const details = detailedServices[key]
      if (details instanceof Array) {
        details.forEach(value => {
          const token = key + ' - ' + value
          count[token] = 1
        })
      } else {
        count[key] = 1
      }
    })
    return count
  },

  specialServices (json) {
    return json.mohApprovedSpecialServices || []
  },

  programmes (json) {
    return json.programmes || []
  },

  openingDays (json) {
    const count = {}
    const operatingHours = json.operatingHours || {}
    Object.keys(operatingHours).forEach(key => {
      count[key] = 1
    })
    return count
  },

  openingHours (json) {
    const count = {}
    const operatingHours = json.operatingHours || {}
    Object.keys(operatingHours).forEach(key => {
      const value = operatingHours[key]
      count[value] = 1
    })
    return count
  },

  licenseClass (json) {
    return json.licenseClass
  },

  coordinates (json) {
    return json.coordinates
  },

  svy21 (json) {
    return json.svy21
  },

  planningArea (json) {
    return json.planning_area
  }
}
