Forms
===============
Easy to use fully reactive forms. It was built ground-up aiming to eliminate the boilerplate of building forms in our applications (without creating more boilerplate).

This is the offspring of our vision for a forms package which is fully reactive and fully agnostic and independent of how information is presented (including how validation errors are displayed and the use of CSS).

There are two things that Forms does well:

* seamless and fully reactive interface for capturing and retrieving form data and form related events  
* flexible and easy to configure data validation

Table of Contents
---------------
- [Getting started](#getting-started)
- [Inserting a new document](##inserting-a-new-document)
- [Editing an existing document](##Editing-an-existing-document)
- [Adding validation](##Adding-validation)
- [Handling validation errors](##Handling-validation-errors)
- [Advanced](##Advanced)
- [Contributing](#contributing)


##Getting started
---------------
(adding the package)
(adding the mixin - link to api docs for more)
(creating a basic form)
TBA

##Inserting a new document
---------------
(how does Forms capture field data from the template)
(example submit/insert event handler - tmpl.form.doc vs event doc)
(tip: manipulation of document data before submit)
TBA

##Editing an existing document
---------------
(Using Forms helpers to populate form fields)
(example submit/update event handler)
(tip: displaying a different button depending on whether it is an insert or edit form)
TBA

##Adding validation
---------------
(Setting up a schema)
(adding custom validators)
(using the built-in validators)
TBA

##Handling validation errors
---------------
(capturing the documentInvalid event)
(using form helper to display errors inline)
(using form helper to display a list of all errors)
(tip: adding a custom `invalid` css class on error)
TBA

##Advanced
---------------
(adding onCreated and onMixin hooks)
(overriding events - triggering the doc update/validation process flow manually )
(overriding helpers - manipulating the internal doc directly)
(triggering custom errors)
(creating interconnected input fields e.g. range slider using propertyChange)

#Contributing
---------------
TBA


Global Api
---------------

* `Forms.mixin(template, options)` - options is an object, at a minimum the app developer should be able to turn template helpers and events on and off, other options that make sense should also be configurable via this object.
* `Forms.methods(methods)` - methods is an object of names to functions, these helpers are added to the tmpl.form instance, but are not exposed as helpers
* `Forms.helpers(helpers)` - helpers is an object of names to functions, should behave like Template.x.helpers, these methods are added to the tmpl.form instance and also added as helpers
* `Forms.events(events)` - events is an object of event selectors to functions, should behave like Template.x.events
* `Forms.onCreated(callback)` - etc.
* `Forms.onMixin(callback)` like onCreated, but callback is called during Forms.mixin invocation.
* `Forms.instance()` alias for `Template.instance().form`

Instance state
--------------
A Forms instance stores state in three places:

* `tmpl.form.doc` - The document being edited, under the hood we store this document in a ReactiveVar, we initialize this document from the data context, but you can also pass a default document in as part of the mixin options.
* `tmpl.form.schema` - The schema for the document, an object who's keys contain validation rules to be run against the document at validation time. Under the hood we store this in a ReactiveVar, we initialize this object from the data context, but you can also pass in a default schema as part of the mixin options
* `tmpl.form.errors` - A collection of errors, under the hood we store this as a null backed Mongo.Collection.

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

* `change input` -> `form.change({[e.currentTarget.name]: e.currentTarget.value}, e.currentTarget, e);`
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
