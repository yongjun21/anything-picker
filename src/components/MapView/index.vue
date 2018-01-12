<template>
  <div class="picker-map column">
    <div class="map-container auto" ref="container" />
    <PostalCodeControl class="absolute-top-left" />
  </div>
</template>

<script>
import {Platform} from 'quasar-framework'
import {mapState, mapGetters} from 'vuex'
// import {toSVY21} from 'sg-heatmap/dist/helpers/geometry'

import PostalCodeControl from './PostalCodeControl'

export default {
  name: 'MapView',
  props: {
    entityId: String,
    hovered: String,
    selectedTab: String
  },
  computed: {
    ...mapState(['entityList', 'bookmarked', 'location']),
    ...mapState({
      schoolLevel: state => state.schoolLevel.selected,
      homeSchoolDistance: state => state.homeSchoolDistance}
    ),
    ...mapGetters(['filtered', 'suggested']),

    // Set styling of marker depending on settings
    visibleEntities () {
      // const {oneKm, twoKm} = this.homeSchoolDistance
      // const location = this.location && toSVY21(this.location)
      //
      // function getMarkerLabel (school) {
      //   if (location) {
      //     if (school.levelOfEducation.indexOf('P') > -1) {
      //       if (oneKm.indexOf(school.id) > -1) return 'within_1km'
      //       else if (twoKm.indexOf(school.id) > -1) return 'within_2km'
      //     } else {
      //       let distance = Math.sqrt(
      //         Math.pow(location[0] - school.svy21[0], 2) +
      //         Math.pow(location[1] - school.svy21[1], 2)
      //       )
      //       if (distance <= 1000) return 'within_1km'
      //       else if (distance <= 2000) return 'within_2km'
      //     }
      //   }
      //   return 'default'
      // }

      return this.entityList.map(centre => {
        if (centre.id === this.entityId) {
          return 'focused'
        } else if (this.selectedTab === '/bookmark') {
          if (this.bookmarked.indexOf(centre.id) > -1) return 'bookmarked'
        } else {
          if (this.filtered.indexOf(centre.id) > -1) {
            if (this.bookmarked.indexOf(centre.id) > -1) return 'bookmarked'
            return 'default'
          }
          if (this.suggested.indexOf(centre.id) > -1) {
            if (this.bookmarked.indexOf(centre.id) > -1) return 'bookmarked'
            return 'suggested'
          }
        }
        return null
      })
    }
  },
  mounted () {
    const mapSettings = {
      center: [1.352083, 103.819836],
      zoom: 13,
      minZoom: 11,
      maxZoom: 17,
      maxBounds: [[1.16, 103.582], [1.48073, 104.1647]],
      maxBoundsViscosity: 1.0,
      preferCanvas: true
    }

    const markerTypes = {
      default: {
        fillColor: 'rgb(241,126,89)',
        fillOpacity: 1,
        weight: 1,
        color: 'white',
        radius: 7
      },
      bookmarked: {
        icon: L.icon({
          iconUrl: '/assets/Star_White.svg',
          iconSize: [25, 25],
          className: 'icon-bookmarked'
        }),
        zIndexOffset: 100
      },
      focused: {
        icon: L.divIcon({
          iconSize: [15, 15],
          className: 'icon-focused'
        }),
        zIndexOffset: 400
      },
      home: {
        icon: L.icon({
          iconUrl: '/assets/Home.svg',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: 'icon-home'
        }),
        zIndexOffset: 400
      }
    }

    const map = L.map(this.$refs.container, mapSettings)

    // L.tileLayer('https://maps-{s}.onemap.sg/v3/Grey/{z}/{x}/{y}.png', {

    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
      keepBuffer: 9999999999,
      detectRetina: true,
      attribution: `
        <div class="desktop-only">
          <b>LEGEND</b>
          <span class="default"></span>Childcare
          <span class="home"></span>Home
          <span class="bookmark"></span>Bookmarked
          <span class="selected"></span>Selected
        </div>
        &copy; <a href="//www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="//cartodb.com/attributions">CartoDB</a>
        `
      //   <img src="https://docs.onemap.sg/maps/images/oneMap64-01.png" class="onemap-attribution" />
      //   Map data © contributors, <a href="http://SLA.gov.sg">Singapore Land Authority</a>
      // `
    }).addTo(map)

    map.zoomControl.setPosition('topright')
    map.attributionControl.setPrefix('')

    const tooltip = L.tooltip({
      direction: 'top',
      offset: [0, -6],
      permanent: true
    })

    const markers = this.entityList.map(centre => {
      const [lng, lat] = centre.coordinates
      return L.circleMarker([lat, lng])
        .on('click', e => {
          if (Platform.is.mobile) this.$emit('hover', centre.id)
          else this.$emit('focus', centre.id)
        })
        .on('mouseover', e => {
          if (this.entityId || Platform.is.mobile) return
          this.$emit('hover', centre.id)
        })
        .on('mouseout', e => {
          if (this.entityId || Platform.is.mobile) return
          this.$emit('hover', null)
        })
    })

    // Map markers
    let homeMarker
    let visibleMarkers = []

    function fitBounds () {
      if (this.entityId) return
      if (homeMarker) map.flyTo(homeMarker.getLatLng(), 13)
      else if (visibleMarkers.length > 0) map.fitBounds(L.featureGroup(visibleMarkers).getBounds())
    }

    this.$watch('visibleEntities', function (visible) {
      visibleMarkers.forEach(marker => {
        marker.remove()
      })
      visibleMarkers = []

      markers.forEach((marker, i) => {
        const type = markerTypes[visible[i]]
        if (type) {
          if (type.icon) {
            const iconMarker = L.marker(marker.getLatLng(), {
              icon: type.icon,
              zIndexOffset: type.zIndexOffset
            }).addTo(map)
            visibleMarkers.push(iconMarker)
            marker.setStyle({fillOpacity: 0, opacity: 0})
          } else {
            marker.setStyle(markerTypes[visible[i]])
          }
          marker.addTo(map)
          visibleMarkers.push(marker)
        }
      })

      fitBounds.call(this)
    }, {immediate: true})

    this.$watch('hovered', function (hovered) {
      this.entityList.forEach((entity, i) => {
        if (entity.id === this.hovered) {
          markers[i].bindTooltip(tooltip).setTooltipContent(entity.name)
        } else {
          markers[i].unbindTooltip(tooltip)
        }
      })
    }, {immediate: true})

    this.$watch('location', function (lnglat) {
      if (!lnglat) {
        if (homeMarker) {
          homeMarker.remove()
          homeMarker = null
        }
      } else {
        const [lng, lat] = lnglat
        if (homeMarker) {
          homeMarker.setLatLng([lat, lng])
        } else {
          homeMarker = L.marker([lat, lng], {
            icon: markerTypes['home'].icon,
            zIndexOffset: markerTypes['home'].zIndexOffset
          }).addTo(map)
        }
      }
      fitBounds.call(this)
    }, {immediate: true})

    this.$watch('entityId', function (id) {
      if (id) {
        const [lng, lat] = this.entityList.filter(school => school.id === id)[0].coordinates
        map.flyTo([lat, lng], 15, {duration: 0.3})
        this.$emit('hover', id)
      } else {
        this.$emit('hover', null)
      }
    }, {immediate: true})
  },
  components: {PostalCodeControl}
}

</script>

<style lang="scss">
.picker-map {
  position: relative;

  .leaflet-marker-icon {
    border-radius: 50%;
    border: 0;

    &.hovered {
      z-index: 1000!important;
    }
  }

  .leaflet-pane,
  .leaflet-top,
  .leaflet-bottom {
    z-index: 0;
  }

  .leaflet-tooltip {
    opacity: 1!important;
    border-radius: 5px;
    font-weight: bold;
    color: inherit;
  }

  .leaflet-control-attribution {
    opacity: 1;
    background-color: white;
    padding: 15px;

    .onemap-attribution {
      width: 12px;
      height: 12px;
      margin-right: 5px;
    }

    .mobile & {
      height: 13px;
      font-size: 7px;
      padding: 2px;

      .onemap-attribution {
        width: 8px;
        height: 8px;
        margin-right: 3px;
      }
    }

    div {
      padding-bottom: 10px;
    }

    span {
      border-radius: 50%;
      width: 10px;
      height: 10px;
      display: inline-block;
      margin-right: 5px;
      margin-left: 7px;

      &:first-child {
        margin-left: 2px;
      }
      &.default {
        background-color: rgb(241,126,89);
      }
      &.home {
        background-color: rgb(27,45,72);
      }
      &.within_1km {
        background-color: rgb(6,117,153);
      }
      &.within_2km {
        background-color: rgb(92,208,253);
      }
      &.bookmark {
        background-color: rgb(61, 203, 181);
      }
      &.selected {
        background-color: rgb(247,177,70);
      }
    }
  }

  .leaflet-control-zoom {
    .mobile & {
      display: none;
    }
  }

  .icon-bookmarked {
    background-color: rgba(61, 203, 181, 1);
    box-shadow: 0px 0 0 5px rgba(61, 203, 181, 0.5);
    padding: 6px;
    pointer-events: none;
  }

  .icon-focused {
    background-color: rgb(247, 177, 70);
    box-shadow: 0px 0 0 10px rgba(247,177,70,0.5);
    padding: 0;
    pointer-events: none;
  }

  .icon-home {
    background-color: rgb(27, 45, 72);
    box-shadow: 0px 0 0 7px rgba(27, 45, 72, 0.5);
    padding: 10px;
    pointer-events: none;
  }
}
</style>
