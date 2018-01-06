const constants = {
  hasBeef: [
    'Halal Food with Beef(with Certification from MUIS)',
    'No Pork No Lard with Beef(from Non Halal Sources)',
    'No Pork No Lard with Beef(without Certification from MUIS but from Halal Sources)'
  ],
  noBeef: [
    'Halal Food with No Beef(with Certification from MUIS)',
    'No Pork No Lard with No Beef(from Non Halal Sources)',
    'No Pork No Lard with No Beef(without Certification from MUIS but from Halal Sources)'
  ],
  halalWithCert: [
    'Halal Food with Beef(with Certification from MUIS)',
    'Halal Food with No Beef(with Certification from MUIS)'
  ],
  halalSources: [
    'No Pork No Lard with Beef(without Certification from MUIS but from Halal Sources)',
    'No Pork No Lard with No Beef(without Certification from MUIS but from Halal Sources)'
  ]
}

export default {
  name (json) {
    return json.centre_name
  },

  contactNo (json) {
    return json.centre_contact_no
  },

  email (json) {
    return json.centre_email_address
  },

  website (json) {
    return json.centre_website
  },

  organization (json) {
    return [json.organisation_code, json.organisation_description].join(' - ')
  },

  foodOffered (json) {
    return json.food_offered
  },

  vegetarian (json) {
    return json.food_offered === 'Vegetarian'
  },

  beef (json) {
    if (constants.hasBeef.indexOf(json.food_offered) > -1) return true
    if (constants.noBeef.indexOf(json.food_offered) > -1) return false
    return null
  },

  halal (json) {
    if (constants.halalWithCert.indexOf(json.food_offered) > -1) return 'Halal'
    if (constants.halalSources.indexOf(json.food_offered) > -1) return 'Halal sources'
    return 'Non Halal'
  },

  secondLanguage (json) {
    if (json.second_languages_offered) {
      return json.second_languages_offered.split('|')
    } else {
      return []
    }
  },

  schemeType (json) {
    if (json.scheme_type === 'Anchor Operator Scheme') return 'AOP'
    if (json.scheme_type === 'Partner Operator Scheme') return 'POP'
    return null
  },

  sparkCertified (json) {
    return json.spark_certified
  },

  iccp (json) {
    return json.iccp
  },

  provideTransport (json) {
    return json.provision_of_transport
  },

  extendedHours (json) {
    return json.extended_operating_hours
  },

  openingHours (json) {
    const count = {}
    count[json.weekday_full_day] = 1
    count[json.weekday_halfday_am] = 1
    count[json.weekday_halfday_pm] = 1
    count[json.saturday] = 1
    return count
  },

  services (json) {
    const count = {}
    if (json.service_listing) {
      json.service_listing.forEach(row => {
        const token = [row.levels_offered, row.programmes_offered].join(' - ')
        count[token] = 1
      })
    }
    return count
  },

  serviceRemarks (json) {
    const count = {}
    if (json.service_listing) {
      json.service_listing.forEach(row => {
        count[row.remarks] = 1
      })
    }
    return count
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
