// wrap all feathers service requsets with this function
// it returns a combination prop/promise equivalent to m.request
// this should be app.req.find, app.req.get, app.req.on, etc?
const propify = function(m, func) {
  return function() {
    m.startComputation();

    var promise = this._super.apply(this, arguments);
    if(typeof promise.then !== 'function') {
      m.endComputation();
      return result;
    }
    var deferred = m.deferred();
    promise.then(
      function(data) {
        deferred.resolve(data);
        m.endComputation();
      },
      function(err) {
        deferred.reject(err);
        m.endComputation();
      }
    );
    var prop = m.prop(deferred.promise);

    if (promise.subscribe) {
      prop._sub = false;
      prop.sync = function(yes) {
        if (yes && !prop._sub) {
          prop._sub = promise.subscribe(state => {
            m.startComputation();
            prop(state);
            m.endComputation();
          });
          return true;
        } else if (!yes && prop._sub) {
          prop._sub.unsubscribe();
          prop._sub = false;
          return true;
        } else {
          return false;
        }
      }
    }

    return prop;
  }
}

module.exports = function(m) {
  return function() {
    this.mixins.push(function(service) {
      const app = this;
      var mixin = {};
      app.methods.forEach(method => {
        if(typeof service[method] === 'function') {
          mixin[method] = propify(m, method);
        }
      });
      service.mixin(mixin);
    });
  }
}