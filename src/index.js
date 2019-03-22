import Vue from 'vue'
import Quasar, {Loading, Platform, LocalStorage} from 'quasar-framework'

import store from './store'
import router from './router'
import App from './components/App.vue'

Quasar.theme.set('mat')
// prevent Quasar from modifying window.history when modal open
Platform.has.popstate = false
Vue.use(Quasar)

console.log('APP VERSION:', process.env.VERSION)

let storeUpdated = false

router.beforeEach((to, from, next) => {
  if (storeUpdated) {
    storeUpdated = false
    next()
  } else {
    store.dispatch('importOptions', to.query).then(() => {
      if (to.path !== '/intro' && !store.state.schoolLevel.selected) {
        next({path: '/intro'})
      } else {
        next()
      }
    })
  }
})

if (process.env.NODE_ENV === 'production') {
  router.beforeEach((to, from, next) => {
    window.gtag('config', 'UA-116302211-1', {page_path: to.fullPath})
    next()
  })
}

// importOptions is only triggered on initial load or on browser navigation
// push or replace does not trigger importOptions
const _push = router.push
const _replace = router.replace
router.push = function (...args) {
  storeUpdated = true
  _push.apply(router, args)
}
router.replace = function (...args) {
  storeUpdated = true
  _replace.apply(router, args)
}

Loading.show()
store.dispatch('fetchEntityList').then(entityList => {
  Loading.hide()
  window.vm = new Vue({
    el: '#app',
    store,
    router,
    created () {
      if (!window.location.search) {
        const cachedQuery = LocalStorage.get.item('query')
        if (cachedQuery) {
          _replace.call(router, {path: '/explore', query: cachedQuery})
        }
      }
      this.$watch('$route.query', query => {
        LocalStorage.set('query', query)
      })
    },
    render: createElement => createElement(App)
  })
})
