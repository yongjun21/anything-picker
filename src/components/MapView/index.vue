<template>
  <div class="picker-map column">
    <div class="map-container auto" ref="map" />
    <PostalCodeControl class="absolute-top-left" />
  </div>
</template>

<script>
import {Platform} from 'quasar-framework'
import {mapState, mapGetters} from 'vuex'
import getExtent from 'geojson-extent'
// import {toSVY21} from 'sg-heatmap/dist/helpers/geometry'

import PostalCodeControl from './PostalCodeControl'

export default {
  name: 'MapView',
  props: {
    schoolId: String,
    hovered: Array,
    selectedTab: String
  },
  computed: {
    ...mapState(['entityList', 'bookmarked', 'location']),
    ...mapState({schoolLevel: state => state.schoolLevel.selected}),
    ...mapGetters(['filtered', 'suggested']),

    geojson () {
      function getStyle (clinic) {
        if (clinic.id === this.entityId) {
          return 'focused'
        } else if (this.selectedTab === '/bookmark') {
          if (this.bookmarked.indexOf(clinic.id) > -1) return 'bookmarked'
        } else {
          if (this.filtered.indexOf(clinic.id) > -1) {
            if (this.bookmarked.indexOf(clinic.id) > -1) return 'bookmarked'
            return 'default'
          }
          if (this.suggested.indexOf(clinic.id) > -1) {
            if (this.bookmarked.indexOf(clinic.id) > -1) return 'bookmarked'
            return 'suggested'
          }
        }
        return null
      }

      return {
        type: 'FeatureCollection',
        features: this.entityList
          .map((clinic, i) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: clinic.coordinates
            },
            properties: {
              id: clinic.id,
              style: getStyle.call(this, clinic)
            }
          }))
          .filter(f => f.geometry.coordinates && f.properties.style)
      }
    }
  },
  mounted () {
    mapboxgl.accessToken = 'pk.eyJ1IjoieW9uZ2p1bjIxIiwiYSI6ImNpdTY5c2tyZzBqaDgyemxwYjk0Nnlic2UifQ.A5OHCYPcLTupbo1Qi3t5OQ'

    const map = new mapboxgl.Map({
      container: this.$refs.map,
      center: [103.819836, 1.352083],
      zoom: 10,
      minZoom: 10,
      maxZoom: 15,
      style: 'mapbox://styles/yongjun21/cjcer1xlm3nqo2rp4tv7g45y7'
    })

    map.on('load', e => {
      map.addSource('clinics', {
        type: 'geojson',
        data: this.geojson,
        cluster: true,
        clusterMaxZoom: 12
      })
      map.addLayer({
        id: 'clusters',
        source: 'clinics',
        type: 'circle',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgb(241, 126, 89)',
          'circle-opacity': 0.8,
          'circle-radius': 16
        }
      })
      map.addLayer({
        id: 'cluster_count',
        source: 'clinics',
        type: 'symbol',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 8
        }
      })

      map.addLayer({
        id: 'default',
        source: 'clinics',
        type: 'circle',
        filter: ['==', ['get', 'style'], 'default'],
        paint: {
          'circle-color': 'rgb(241, 126, 89)',
          'circle-radius': 7
        }
      })
      map.addLayer({
        id: 'suggested',
        source: 'clinics',
        type: 'circle',
        filter: ['==', ['get', 'style'], 'suggested'],
        paint: {
          'circle-color': 'rgb(241, 126, 89)',
          'circle-radius': 7
        }
      })
      map.addLayer({
        id: 'bookmarked',
        source: 'clinics',
        type: 'circle',
        filter: ['==', ['get', 'style'], 'bookmarked'],
        paint: {
          'circle-color': 'rgb(61, 203, 181)',
          'circle-radius': 10
        }
      })
      map.addLayer({
        id: 'focused',
        source: 'clinics',
        type: 'circle',
        filter: ['==', ['get', 'style'], 'focused'],
        paint: {
          'circle-color': 'rgb(247, 177, 70)',
          'circle-radius': 7
        }
      })

      map.addLayer({
        id: 'bookmarked-symbol',
        source: 'clinics',
        type: 'symbol',
        filter: ['==', ['get', 'style'], 'bookmarked'],
        layout: {
          'icon-image': 'star-white-15',
          'icon-allow-overlap': true
        }
      })

      const tooltip = new mapboxgl.Popup({
        offset: 7,
        closeButton: false,
        closeOnClick: false
      });

      ['default', 'suggested', 'bookmarked', 'focused'].forEach(style => {
        map.on('click', style, e => {
          if (Platform.is.mobile) this.$emit('hover', e.features[0].id)
          else this.$emit('focus', e.features[0].id)
        })
        map.on('mouseenter', style, e => {
          map.getCanvas().style.cursor = 'pointer'
          if (this.schoolId || Platform.is.mobile) return
          this.$emit('hover', e.features.map(f => f.properties.id))
        })
        map.on('mouseleave', style, e => {
          map.getCanvas().style.cursor = ''
          if (this.schoolId || Platform.is.mobile) return
          this.$emit('hover', null)
        })
      })

      this.$watch('hovered', function (hovered) {
        if (hovered) {
          const matches = this.entityList.filter(clinic => hovered.indexOf(clinic.id) > -1)
          tooltip
            .setLngLat(matches[0].coordinates)
            .setHTML(matches.map(clinic => '<p>' + clinic.name + '</p>').join(''))
            .addTo(map)
        } else {
          tooltip.remove()
        }
      }, {immediate: true})

      this.$watch('geojson', function (geojson) {
        map.getSource('clinics').setData(geojson)
        fitBounds.call(this)
      }, {immediate: true})

      this.$watch('entityId', function (id) {
        if (id) {
          const center = this.entityList.filter(school => school.id === id)[0].coordinates
          map.flyTo(center, 15)
          this.$emit('hover', id)
        } else {
          this.$emit('hover', null)
        }
      }, {immediate: true})

      const homeIcon = document.createElement('img')
      homeIcon.setAttribute('src', '/assets/Home.svg')
      homeIcon.setAttribute('width', '36px')
      homeIcon.setAttribute('height', '36px')
      homeIcon.style.padding = '10px'
      homeIcon.style.backgroundColor = 'rgb(27, 45, 72)'
      homeIcon.style.boxShadow = '0px 0 0 7px rgba(27, 45, 72, 0.5)'
      homeIcon.style.borderRadius = '50%'

      let homeMarker

      this.$watch('location', function (lnglat) {
        if (lnglat) {
          homeMarker = homeMarker || new mapboxgl.Marker(homeIcon)
          homeMarker.setLngLat(lnglat).addTo(map)
        } else if (homeMarker) {
          homeMarker.remove()
          homeMarker = null
        }
        fitBounds.call(this)
      }, {immediate: true})

      function fitBounds () {
        if (this.entityId) return
        if (homeMarker) {
          map.flyTo({center: this.location, zoom: 14})
        } else if (this.geojson.features.length > 0) {
          const bound = getExtent(this.geojson)
          map.fitBounds(bound, {padding: 50})
        }
      }
    })
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

  .mapboxgl-popup p {
    margin-bottom: 0;
    font-size: 12px;
    line-height: 1.6em;
  }
}
</style>
