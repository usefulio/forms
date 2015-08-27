Forms
===============
**TLDR; Go to [Getting started](#getting-started) to start having fun with Forms now.**

## What is Forms?
Easy to use fully reactive forms. It was built ground-up aiming to eliminate the boilerplate of building forms in our applications (without creating more boilerplate).

Forms package is fully reactive, fully agnostic of and independent from how information is presented, including how validation errors are displayed and transparent to any use of CSS.

There are two things that Forms package does well:

* seamless and fully reactive interface for capturing and retrieving form data and form manipulation events  
* flexible and easy to configure data validation

Table of Contents
---------------
- [Getting started](#getting-started)
- [Accesing and manipulating Form fields data](#accesing-and-manipulating-form-fields-data)
- [Inserting a new document](#inserting-a-new-document)
- [Editing an existing document](#editing-an-existing-document)
- [Adding validation](#adding-validation)
- [Handling validation errors](#handling-validation-errors)
- [Advanced topics](#advanced topics)
- [Contributing](#contributing)
- [Global API](#global-api)

## Getting started

**Step 1:** Add Forms package to you app:

```meteor add useful:forms```

**Step 2:** Create your form template. Note that there is no need to add any special css or template inclusions. Forms simply detects html `<form>` tags.  

```html
<template name="FormsDemoApp">
  <form>
    <label for="name">Name</label>
    <input type="text" name="name">

    <label for="telephone">Telephone</label>
    <input type="text" name="telephone">

    <button type="submit">Submit form</button>
  </form>
</template>
```

**Step 3:** Add Forms functionality to your template using the `mixin` method in your client code.
```js
if(Meteor.isClient){
  Forms.mixin(Template.FormsDemoApp);  
}
```  

That's it! You can now enjoy all the amazing features, advanced flexibility and outstanding simplicity of the [Forms API](#global-api).  

Most of the interaction with the Forms API takes place via three interfaces:
- The `form` object which is attached to the template instance when `Forms.mixin` is executed. (see [Instance state](#instance-state) and [Instance API](#instance-api) for details)
- A set of events triggered by Forms to give the developer maximum flexiblity on how to handle different validation scenarios. (see [Forms Events](#forms-events) for details)
- A set of built-in Forms reactive helpers which give access to the form fields values and any generated validation errors.

##Accesing and manipulating Form fields data
Forms maintains a reactive document internally in order to store the current values of the form fields. The `name` attribute of an input element is used in order to determine the name of each document field. For example:

```html
<template name="FormsDemoApp">
  <form>
    <label for="name">Name</label>
    <input type="text" name="name">

    <label for="telephone">Telephone</label>
    <input type="text" name="telephone">
  </form>
</template>
```

will result in a document object similar to:
```js
{
  name: '...',
  telephone: '...'
}
```

Forms monitor the template form fields for changes which are automatically captured in the internal reactive document (by monitoring `change` events). The document can be accessed in one of the following ways:
- through the javascript API (reactive)
- through the built-in template helpers (reactive)
- passed as an argument with the 'documentSubmit' event (non-reactive)

Example: retrieving `name` field value using javascript API:
```js
Template.FormsDemoApp.helpers({
  'nameIsBob': function () {
    var tmpl = Template.instance()
    return tmpl.form.doc('name') === 'bob';
  }
});
```

Example: getting 'name' field value through helpers. The text of the <p> section will be updated reactively every time the value of `name` input changes.
```html
<template name="FormsDemoApp">
  <form>
    <label for="name">Name</label>
    <input type="text" name="name" >

    <label for="telephone">Telephone</label>
    <input type="text" name="telephone">
    <button type="submit">Submit form</button>
    <p>The name is: {{doc 'name'}}</p>
  </form>
</template>
```

## Inserting a new document _(without validation)_
When a 'submit' event is triggered, Forms automatically prevents the default submit handler, executes any validation specified in the schema (see [Adding validation](#adding-validation) for more), and triggers one of two javascript events:
- `documentSubmit` [Form package event](#forms-events) if validation was successful
- `documentInvalid` [Form package event](#forms-events) if validation was unsuccessful

Here follows is a simple insert scenario without validation:
```html
<template name="FormsDemoApp">
  <form>
    <label for="name">Name</label>
    <input type="text" name="name">

    <label for="telephone">Telephone</label>
    <input type="text" name="telephone">
  </form>
</template>
```

```js
var Contacts = new Mongo.Collection('contacts');

Template.FormsDemoApp.events({
  'documentSubmit': function (event, tmpl, doc) {
    // Note that documentSubmit will also pass the validated document
    // as a parameter. This instance of the document object is NOT reactive.
    Contacts.insert(doc);
  };
});
```

### Manipulation of document data before submit
There are circumstances where the input element value does not match the value that you would like to store in the document e.g. converting a date picker value to number-of-days or performing a unit conversion. You can modify document values before submition either by monitoring for the `propertyChange` event or by creating a custom `submit` handler. Creating a custom `submit` handler is covered in [Advanced topics](#advanced topics). Here follows an example of modifying a document value by capturing `propertyChange`. You can use `tmpl.form.doc([field-name])` method to both read and write any document value (if you pass a field name as a parameter) or the entire document (see [Instance API](#instance-api)).

```js
// In the following example we want to ensure that 'name' is always stored in our document capitalized.
Template.FormsDemoApp.events({
  // Note how propertyChange event passes all changes as a parameter.
  // The parameter contains a set of key-value pairs.
  'propertyChange': function (e, tmpl, changes) {
    if (changes.name)
      tmpl.doc.('name', changes.name.toUpperCase());
  }
});
```

## Editing an existing document
Forms gives access to the document fields through the `doc [field-name]` template helper. This is especially useful when you want to create an edit-type form. Consider the following example:

```html
<template name="FormsDemoApp">
  <form>
    <label for="name">Name</label>
    <input type="text" name="name" value={{doc name}}>

    <label for="telephone">Telephone</label>
    <input type="text" name="telephone" value={{doc telephone}}>
  </form>
</template>
```

You can therefore easily create an edit-type form by setting the Forms document when the template is being rendered. e.g.:

```js
Template.FormsDemoApp.onRendered(function () {
  var tmpl = this;
  // for this example we assume that the data context of the template contains the document to be edited.
  tmpl.form.doc(tmpl.data);
});
```

## Adding validation
Adding validation is as simple as defining a schema for the form document. A schema can be defined using `tmpl.form.schema` method using the following syntax:
```js
  var tmpl = Template.instance();

  tmpl.form.schema({
    'field-name': function (value, property) {
      // the first parameter holds the current value of the field
      // the second parameter holds the field/property name
      // the function should return `true` if valid or an error message
      // if invalid.
      var isValid = false;
      var errorMessage = "field is invalid";
      if (_someValidationCheckIsTrue_) {
        isValid = true
      }

      return isValid || errorMessage;
    }
    ...
  });
```

A good practice is to place the schema definition inside the form template onCreated hook in order to ensure that Forms instance has been initialized.

We will use the following template as a reference for the two validation examples that follow.
```html
<template name="FormsDemoApp">
  <form>
    <label for="name">Name</label>
    <input type="text" name="name">

    <label for="telephone">Telephone</label>
    <input type="text" name="telephone">

    <label for="nights">How many nights will you be staying?</label>
    <input type="number" name="nights">
  </form>
</template>
```
### Adding custom validators
```js
Forms.mixin(Template.FormsDemoApp);

Template.FormsDemoApp.onCreated(function() {
    // Forms.instance() is an alias to Template.instance().forms
    Forms.instance().schema({
      'name': function (value, property) {
        // check that name is a non-empty string
        var isValid = false;
        var errorMessage = "Name cannot be empty";

        if (_.isString(value) && value.length)
          isValid = true;

        return isValid || errorMessage;
      },
      'telephone': function (value, property) {
        // checks that telephone is a 10 digit number
        var isValid = false;
        var phoneno = /^\d{10}$/;  
        var errorMessage = "Telephone must be a 10-digit number";

        if (value.match(phoneno))
          isValid = true;

        return isValid || errorMessage;
      },
      'nights': function (value, property) {
        // checks that nights is greater than zero
        var isValid = false;
        var errorMessage = "Number of nights should be greater than 1";

        if ((value % 1 === 0) && (value > 0))
          isValid = true;

        return isValid || errorMessage;
      }
    });
});
```

### Using built-in validators
Forms comes with a set of built-in validators and preset regex to speed-up schema definitions.
TBA

## Handling validation errors
- (capturing the documentInvalid event)
- (using form helper to display errors inline)
- (using form helper to display a list of all errors)
- (tip: adding a custom `invalid` css class on error)
TBA

## Advanced
- (adding onCreated and onMixin hooks)
- (overriding events - triggering the doc update/validation process flow manually )
- (overriding helpers - manipulating the internal doc directly)
- (triggering custom errors)
- (creating interconnected input fields using propertyChange e.g. range slider)
TBA

## Contributing
TBA


# Global Api
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

## Forms Events
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
