Easy to use reactive forms with validation
===============

Global Api
---------------

* `Forms.mixin(template, options)` - options is an object, at a minimum the app developer should be able to turn template helpers and events on and off, other options that make sense should also be configurable via this object.
* `Forms.methods(methods)` - methods is an object of names to functions, these helpers are added to the tmpl.form instance, but are not exposed as helpers
* `Forms.helpers(helpers)` - helpers is an object of names to functions, should behave like Template.x.helpers, these methods are added to the tmpl.form instance and also added as helpers
* `Forms.events(events)` - events is an object of event selectors to functions, should behave like Template.x.events
* `Forms.onCreated(callback)` - etc.
* `Forms.onMixin(callback)` like onCreated, but callback is called during Forms.mixin invocation.
* `Forms.instance()` alias for `Template.instance().form`

Instance Api
--------------

Each template instance which has been extended by the Forms library should provide a single property from which the form helpers are available:

* `tmpl.form` - an object, also the this context when form helpers are called
* `tmpl.form.doc([fieldName, [fieldValue]])` a method which gets or sets the document or one of it's properties
    * `tmpl.form.doc()` gets the doc
    * `tmpl.form.doc('name')` gets the name property of the doc
    * `tmpl.form.doc('name', 'John Smith')` sets the name property to 'John Smith'
    * `tmpl.form.doc({ name: 'John Smith'  })` replaces the current document with the passed in object
* `tmpl.form.schema([fieldName, [fieldValidator]])` - a method which gets or sets the schema or one of it's properties
* `tmpl.form.errors([fieldName, [errorsArray]])` - a method which gets or sets the errors associated with the doc or one of it's properties

* `tmpl.form.get(fieldName)` - alias for `tmpl.form.doc(fieldName)`
* `tmpl.form.set(fieldName, fieldValue)` - alias for `tmpl.form.doc(fieldName, fieldValue)`

* `tmpl.form.error([fieldName])` - sugar for `_.first(tmpl.form.errors([fieldName]))`
* `tmpl.form.isValid([fieldName])` - sugar for `!_.any(tmpl.form.errors([fieldName]))`
* `tmpl.form.isInvalid([fieldName])` - sugar for `_.any(tmpl.form.errors([fieldName]))`

* `tmpl.form.invalidate([fieldName], errors, [eventTarget], [originalEvent])` - sugar for `tmpl.form.errors([fieldName,] errors)` if `eventTarget` is passed, will trigger a `documentInvalid` or `propertyInvalid` event, if the errors array is empty or null, clears errors for the doc or property
* `tmpl.form.validate([fieldName], [eventTarget], [originalEvent])` - validates the current document or specified property against the current schema, if `eventTarget` is passed and the validated object or property is invalid, will trigger a `documentInvalid` or `propertyInvalid` event, calling this method will clear out any existing errors (for the doc or property being validated)
* `tmpl.form.change(fieldName, fieldValue, [eventTarget], [originalEvent])` - calls `tmpl.form.set`, if `eventTarget` is passed will also trigger a `documentChanged` event
* `tmpl.form.change(changes, [eventTarget], [originalEvent])` - calls `tmpl.form.set` once for each key-value pair in the `changes` object, if `eventTarget` is passed will also trigger a single `documentChanged` event
* `tmpl.form.submit([eventTarget], [originalEvent])` - performs the default submit action (validates document), if `eventTarget` is passed will also trigger a `documentSubmit` event, or if the form is invalid a `documentInvalid` event.

Each of the above methods should check `isDefaultPrevented` and `preventDefault` if `originalEvent` is passed.

Forms Events
--------------

* `$(field).trigger('propertyChange', [changes])` - on input change, the forms package should trigger this event, changes is an object who's key-value pairs represent the properties which have changed. In theory changes should have only one key-value pair, however app developers should have the option to add as many key-value pairs as they like, if for example they want to store a date on three seperate properties, but are using a single input element for user input, then one `change` event would trigger a single `propertyChange` event with three key-value pairs, rather than triggering three events.
* `$(field).trigger('documentChange', [doc, changes])` - on propertyChange the forms package should trigger this event, changes is an object who's key-value pairs represent the properties which have changed.
* `$(field).trigger('propertyInvalid', [doc, errors])` - the forms package should trigger this event if this particular field was validated singally (e.g. by calling `tmpl.form.invalidate`), doc is the form doc, errors is an array of errors related to the property which is invalid.
* `$(form).trigger('documentInvalid', [doc, errors])` - the forms package should trigger time the doc is validated in the context of an event and the doc is invalid (e.g. form submit, `form.validate`, `form.invalidate`, etc.), doc and errors are as above, except that the errors array is not filtered by any fields.
* `$(form).trigger('documentSubmit', [doc])` - on form submit, or if the the app developer calls `form.submit`, if the document is valid the forms package should trigger this event.


Handled Events
------------

The forms package should handle the following events, all event handlers should simply be passthrough methods to the relevant form helper, like so:

* `input change` -> `form.change({[e.currentTarget.name]: e.currentTarget.value}, e.currentTarget, e);`
* `propertyChange` `form.change(changes, e.currentTarget, e);`
* `submit` -> `form.submit(e.currentTarget, e);`

Implementation Notes
-----------

all forms helpers should use lazy initialization to create undocumented properties for storing state, for example the doc helper should look like this:

```
var doc = function (fieldName, fieldValue) {
  
  // ...

  if (!this._doc)
    this._doc = new ReactiveVar();

  // ...
}
```

all form helpers created via the `helpers` method should be stored in an undocumented `_helpers` object, and should also adhear to the following rules:

1. `Helpers` don't override `methods` when attached to the forms (e.g. if a `helper` and a `method` both exist with the same name, the `helper` should be attached to the Template.X.helpers, but not to `tmpl.form`)
2. Each helper should be wrapped when attaching to the Template, like so:

```
  // this is the effect we want, but you'll have to use a loop to attach all form helpers to the 
  // form instance
  template.form._helpers = {};
  template.form._helpers.doc = _.bind(Forms._helpers.doc, template.form);
  template.helpers({
    doc: function () {
      return Forms.instance()._helpers.doc.apply(this, arguments);
    }
  })
```
