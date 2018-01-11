<template>
  <div class="card column no-shadow">
    <div class="card-title text-primary">
      <span>{{this.info.centre_name}}</span>
      <a :href="this.info.centre_website" target="_blank">website</a>
    </div>
    <div class="card-content">
      <div>
        <div>{{centreSummary.organisation_description}}</div>
      </div>

      <span class="action-bookmark cursor-pointer text-primary"
        :class="{'text-bookmark': bookmarked}"
        @click="$emit('bookmark', info.id)">
        <img :src="bookmarked ? '/assets/Star_Green.svg' : '/assets/Star_Blue.svg'" />
        Bookmark
      </span>

      <span class="action-traveltime" v-if="travelTime">
        <img src='/assets/Car.svg'/>
        {{travelTime}}
      </span>
    </div>

    <div class="list item-delimiter auto column text-primary">
      <q-collapsible ref="generalInfo" label="GENERAL INFO">
        <dl>
          <template v-for="row in generalInfo" v-if="row.value">
            <dt>{{row.label}}</dt>
            <template v-if="row.value instanceof Array">
              <dd v-for="value in row.value">{{value}}</dd>
            </template>
            <dd v-else>{{row.value}}</dd>
          </template>
        </dl>
      </q-collapsible>

      <q-collapsible ref="operatingHours" label="OPERATING HOURS">
        <dl>
          <template v-for="row in operatingHours" v-if="row.value">
            <dt>{{row.label}}</dt>
            <template v-if="row.value instanceof Array">
              <dd v-for="value in row.value">{{value}}</dd>
            </template>
            <dd v-else>{{row.value}}</dd>
          </template>
        </dl>
      </q-collapsible>

      <q-collapsible ref="vacancies" label="VACANCIES">
        <dl>
          <template v-for="row in vacancies" v-if="row.value">
            <dt>{{row.label}}</dt>
            <template v-if="row.value instanceof Array">
              <dd v-for="value in row.value">{{value}}</dd>
            </template>
            <dd v-else>{{row.value}}</dd>
          </template>
        </dl>
      </q-collapsible>

      <q-collapsible ref="servicesOffered" label="SERVICES">
        <div class="row wrap">
           <dl class="width-1of2" v-for="row in servicesOffered">
            <dt>{{row.label}}</dt>
            <dd v-for="value in row.values">
              {{value}}
            </dd>
          </dl>
        </div>
      </q-collapsible>

      <q-collapsible ref="contactInfo" label="CONTACT" class="text-primary">
        <dl>
          <template v-for="row in contactInfo" v-if="row.value">
            <dt>{{row.label}}</dt>
            <template v-if="row.href">
              <dd><a :href="row.href" :target="row.href.match(/^mailto/) ? null : '_blank'">
                {{row.value}}
              </a></dd>
            </template>
            <dd v-else>{{row.value}}</dd>
          </template>
        </dl>
      </q-collapsible>

      <q-collapsible ref="gettingThere" label="GETTING THERE">
        <dl>
          <template v-for="row in gettingThere" v-if="row.value">
            <dt>{{row.label}}</dt>
            <dd>{{row.value}}</dd>
          </template>
        </dl>
      </q-collapsible>

    </div>
    <div class="exit absolute-top-right cursor-pointer" @click="$emit('close')">
      <i class="text-grey">
        clear
      </i>
    </div>
  </div>
</template>

<script>
import omit from 'lodash/omit'
import max from 'lodash/max'
import maxBy from 'lodash/maxBy'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'

export default {
  props: {
    info: Object,
    bookmarked: Boolean
  },
  data () {
    return {
      medalIcon: {
        Distinction: '/assets/Gold.svg',
        Accomplishment: '/assets/Silver.svg',
        Recognition: '/assets/Bronze.svg',
        Gold: '/assets/Gold.svg',
        Silver: '/assets/Silver.svg',
        Bronze: '/assets/Bronze.svg',
        '1st': '/assets/Gold.svg',
        '2nd': '/assets/Silver.svg',
        '3rd': '/assets/Bronze.svg'
      }
    }
  },
  computed: {
    logo () {
      // return 'http://sis.moe.gov.sg' + this.info.logo.slice(1)
    },
    distance () {
      if ('distance' in this.info) {
        if (this.info.distance >= 10000) return (this.info.distance / 1000).toFixed(0) + ' KM'
        else if (this.info.distance > 1000) return (this.info.distance / 1000).toFixed(1) + ' KM'
        else return this.info.distance.toFixed(0) + ' M'
      }
    },
    centreSummary () {
      return {
        organisation_description: this.info.organisation_description
      }
    },
    travelTime () {
      if ('travelTime' in this.info) {
        if (this.info.travelTime > 3600) return 'More than 1 hr'
        else return Math.ceil(this.info.travelTime / 60) + ' min'
      }
    },
    contactInfo () {
      return [
        {label: 'Email', value: this.info.centre_email_address.toLowerCase(), href: 'mailto:' + this.info.email},
        {label: 'Address', value: this.info.centre_address},
        {label: 'Telephone / Fax', value: (this.info.centre_contact_no || 'Not available') + ' / ' + (this.info.fax || 'Not available')}
      ]
    },
    gettingThere () {
      return [
        {label: 'Nearest MRT', value: this.info.mrt && this.info.mrt.join(', ')},
        {label: 'Bus Services', value: this.info.bus},
        {label: 'School Bus', value: this.info.provision_of_transport ? 'Yes' : 'No'},
      ]
    },
    generalInfo () {
      const info = this.info
      return [
        {label: 'Spark Certified', value: info['spark_certified']},
        {label: 'Food Offered', value: info['food_offered']},
        {label: 'Scheme Type', value: info['scheme_type']}
      ]
    },
    operatingHours () {
      return [
        {label: 'Weekday Full Day', value: this.info['weekday_full_day']},
        {label: 'Weekday Halfday AM', value: this.info['weekday_halfday_am']},
        {label: 'Weekday Halfday PM', value: this.info['weekday_halfday_pm']},
        {label: 'Saturday', value: this.info['saturday']}
      ]
    },
    servicesOffered () {
      const info = this.info.service_listing
      if (info && Object.keys(info).length > 0) {
        return Object.keys(info).map(programmes_offered => ({programmes_offered, values: info[programmes_offered]}))
      } else {
        return [{label: 'None available', values: []}]
      }
    },
    vacancies () {
      return [
        {label: 'Infant Vacancy', value: this.info['infant_vacancy']},
        {label: 'Pre Nusery Vacancy', value: this.info['pg_vacancy']},
        {label: 'N1 Vacancy', value: this.info['n1_vacancy']},
        {label: 'N2 Vacancy', value: this.info['n2_vacancy']},
        {label: 'K1 Vacancy', value: this.info['k1_vacancy']},
        {label: 'K2 Vacancy', value: this.info['k2_vacancy']}
      ]
    }
  }
}
</script>

<style lang="scss">
@import "~style/variables.scss";

.picker-detail-card {
  margin-bottom: 0;
  font-size: 0.8em;

  .card-title {
    padding: 30px 28px 10px 36px;
    display: flex;
    align-items: center;
    margin-bottom: 5px!important;

    a {
      margin-left: 1em;
      font-size: 60%;
    }
  }

  .card-content {
    padding: 0 28px 30px 36px;

    dl {
      margin: 1em 0;
    }

    & > span {
      margin-right: 1em;

      img {
        height: 10px;
        margin-right: 5px;
      }
    }

    .fully-booked > td:last-child::after {
      content: "full";
      margin-left: 0.5em;
      color: red;
      font-size: 0.8em;
      font-weight: 500;
    }
  }

  .q-collapsible {
    overflow-y: auto;
    min-height: 69px;
    padding: 10px 20px;

    .item.item-link {
      height: auto;
      margin: -10px -20px;
      padding: 10px 20px;

      &:hover {
        background: rgba(0, 0, 0, 0.1)
      }

      .item-content {
        font-weight: 700;
        letter-spacing: 0.75px;
        margin-right: 0;
      }

    .item-secondary {
        display: none;
      }
    }

    .q-collapsible-sub-item {
      margin-top: 10px;
    }

    dl:last-child {
      margin-bottom: 0;
    }

    .achivement-container {
      padding-bottom: 20px;

      .legend {
        width: 100%;
        padding: 2px 5px;
        margin-top: 5px;
        border: 0.5px solid rgba(128, 128, 128, 0.25);

        div {
          padding: 3px 0px;
          display: inline-block;
          font-size: 0.8em;
          white-space: nowrap;
          vertical-align: middle;

          img {
            width: 10px;
            height: 10px;
            margin: 0 10px;
          }
        }
      }

      table {
        width: 100%;
        padding-top: 5px;
        border-collapse: collapse;

        tr {
          td {
            border: none;
            width: 45px;
            position: relative;


            &.year-label {
              text-align: center;
            }

            &.cca-label {
              width: 150px;
              padding: 5px 0 5px 10px;
            }

            img {
              margin-left: 20px;
              width: 12px;
              height: 12px;
            }
          }

          &:nth-child(2n) td{
            background: #f2f2f2;
          }
        }
      }
    }
  }

  dd ~ dt {
    margin-top: 1em;
  }

  dt {
    color: $color-secondary;
  }

  .cop-details,
  .l1r5-details,
  .p1-registration {
    width: 100%;

    td {
      width: 50%;
    }
  }

  .row.wrap {
    justify-content: space-between;
  }

  .width-1of2 {
    min-width: 0;
    flex-basis: 45%;
  }

  .exit {
    margin-top: 5px;
    margin-right: 5px;
    padding: 10px;
    font-size: 1.5em;
  }

  .item-content.has-secondary::after {
    content: '';
    float: right;
    position: absolute;
    display: inline-block;
    top: 18px;
    right: 15px;
    border-right: 2px solid grey;
    border-bottom: 2px solid grey;
    height: 8px;
    width: 8px;
    transform: rotate(45deg);
  }
}

.q-tooltip {
  padding: 7px;
  background-color: $color-primary;
  font-size: 10px;
  font-weight: 700;
  white-space: pre;
}
</style>
