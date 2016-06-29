# feathers-mithril
Connect feathers.js to mithril.js


## Installation

Just run `npm install --save feathers-mithril`. You'll also need [Feathers Reactive](https://github.com/feathersjs/feathers-reactive) in your project to use advanced `sync` functionality.

To add to your client, just add it like you would any other feathers plugin:

```javascript
var fm = require('feathers-mithril');
// ...a bit of code later...
var app = feathers()
  .configure(feathers.socketio(socket))
  .configure(feathers.hooks())
  .configure(reactive(rxjs)) // you'll need this call to feathers-reactive for sync to work
  .configure(fm())
  // followed by more app.configure calls here
```

## Basic Usage

It’s really easy! Feathers service calls return combined prop-promises, just like `m.request` does. See below:

```javascript
var result = catService.find();

// Results can be used like usual, as a promise.
result.then(function (data) {
  // do something with data
});

// Or if you're feeling fancy, use a result as a prop instantly!
// The initial value is undefined.
result() // => returns undefined

// But! After the feathers calls loads, the prop value is set,
// and mithril will rerender with the updated data
setTimeout(function() {
   result() // => returns array of results
}, 3000);
```

This feature allows you to pass results directly into views and use them immediately, provided the views can handle `undefined`  prop values.

## Syncing

Although `create` , `get` , `list` , `patch` , `remove` , and a few other service functions all return these fancy hybrid prop-promises, there’s a special function on the props returned by `get` and `list` .

```javascript
var result = catService.get({id: 123});

result.sync(true);

result() // => returns undefined
// ...some time later after the initial load...
result() // => returns {id: 123, name: "Fluffums"}
// ...after another user edits the fluffums object...
result() // => returns {id: 123, name: "Fluffums 2"}
```

That’s right, the prop will automatically update (and the view will rerender) whenever the server info changes!

There is an important caviat, which is you must call `.sync(false)` on the prop in the destructor of the component that called `.sync(true)` , otherwise we’ll get nasty memory leaks.
