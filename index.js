// wrap all feathers service requests with this function
// it returns a combination prop/promise equivalent to m.request
// this should be app.req.find, app.req.get, app.req.on, etc?
var propify = function (m, stream, func) {
  return function () {
    var promise = this._super.apply(this, arguments)
    if (typeof promise.then !== 'function') {
      return promise
    }
    var prop = stream(null)
    promise.then(
      function (data) {
        prop(data)
        m.redraw()
        return Promise.resolve(data)
      },
      function (err) {
        m.redraw()
        throw err
      }
    )
    prop.then = function () {
      return promise.then.apply(promise, arguments)
    }
    prop.catch = function () {
      return promise.catch.apply(promise, arguments)
    }

    if (promise.subscribe) {
      prop._sub = false
      prop.sync = function (yes) {
        if (yes && !prop._sub) {
          prop._sub = promise.subscribe(function (state) {
            prop(state)
            m.redraw()
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

module.exports = function (m, stream) {
  return function () {
    this.mixins.push(function (service) {
      const app = this
      var mixin = {}
      app.methods.forEach(function (method) {
        if (typeof service[method] === 'function') {
          mixin[method] = propify(m, stream, method)
        }
      })
      service.mixin(mixin)
    })
  }
}
