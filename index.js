// wrap all feathers service requests with this function
// it returns a combination prop/promise equivalent to m.request
// this should be app.req.find, app.req.get, app.req.on, etc?
const propify = function (m, func) {
  return function () {
    m.startComputation()

    var promise = this._super.apply(this, arguments)
    if (typeof promise.then !== 'function') {
      m.endComputation()
      return promise
    }
    promise = promise.then(
      function (data) {
        m.endComputation()
        return Promise.resolve(data)
      },
      function (err) {
        m.endComputation()
        return Promise.reject(err)
      }
    )
    var prop = m.prop(promise)

    if (promise.subscribe) {
      prop._sub = false
      prop.sync = function (yes) {
        if (yes && !prop._sub) {
          prop._sub = promise.subscribe(function (state) {
            m.startComputation()
            prop(state)
            m.endComputation()
          })
          return true
        } else if (!yes && prop._sub) {
          prop._sub.unsubscribe()
          prop._sub = false
          return true
        } else {
          return false
        }
      }
    }

    return prop
  }
}

module.exports = function (m) {
  return function () {
    this.mixins.push(function (service) {
      const app = this
      var mixin = {}
      app.methods.forEach(function (method) {
        if (typeof service[method] === 'function') {
          mixin[method] = propify(m, method)
        }
      })
      service.mixin(mixin)
    })
  }
}
