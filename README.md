Useful Forms
==============

Useful Forms extends your templates to make it easy to build reactive forms.

**Write forms the way you want to:**

1. Your own html
2. Your own custom components
3. Automatic access to the doc on submit and via the api
5. Events that make sense for forms
6. Reactive template helpers that make sense for forms
7. An awesome api you can use anywhere in your javascript

<!-- XXX build a tutorial and reference it here -->

Read getting started (below) then checkout the [api docs](#api-docs).

Getting started
--------------

**Step 1:** Add `Forms` package to you app:

    meteor add useful:forms

**Step 2:** Create your form template. Note that there is no need to add any special css or template inclusions. `Forms` simply detects html `<form>` tags. This means you are free to use whatever css framework or html structure you wish, and change it however/whenever you need to.  

```html
<template name="AddContactForm">
  <form>
    <label for="fullName">Name</label>
    <input type="text" name="fullName">

    <label for="telephone">Telephone</label>
    <input type="text" name="telephone">

    <button type="submit">Add Contact</button>
  </form>
</template>
```

**Step 3:** Add `Forms` functionality to your template using the `mixin` method in your client code.
```js
if (Meteor.isClient) {
  Forms.mixin(Template.AddContactForm);  
}
```

**Step 4:** Use the Forms `documentSubmit` event to easily get the doc when the user submits the form.
```js
if (Meteor.isClient) {
  Forms.mixin(Template.AddContactForm);
  Template.AddContactForm.events({
    'documentSubmit': function (e, tmpl, doc) {
      Contacts.insert(doc);
    }
  });
}
```

API Docs
-----------

> **NOTE: throughout this document `tmpl` keyword refers to the template instance object, even if not explicitly stated.**

###Global API

* `Forms.mixin(template, options)` - This method is available globally, use it to extend your template with the forms behavior.
  
```js
  var options = {
    // set helpers to false to disable extending your template with
    // the forms helpers
    helpers: true,
    // set events to false to disable extending your template with
    // the forms events (so that no event handlers will be added to
    // your template)
    events: true,
    // Set the initial doc for your form
    doc: {},
    // Set the schema for your form
    schema: {}
  }

  Forms.mixin(Template.AddContactForm, options);  
```

* `Forms.instance()` This method is available globally and is an alias for `Template.instance().form` but will return `null` if `Template.instance()` is `null`.

###Template form instance

Template instances are extended with a form instance which provides full access to the underlying state of the form.

You can get access to the form instance either by calling `Forms.instance()` or if you already have access to the template instance, you can access it via `tmpl.form` where `tmpl` is the template instance.

> **NOTE: in this section we'll use `form` to mean a form instance, what you would get by calling `Forms.instance()` from within your template javascript.**

####Access the document

* `form.doc()` - Use this method to reactively get the doc with the user's input. Should return a javascript object, or null/undefined.

```js
form.doc() // -> { firstName: 'joe', lastName: 'smith' }
```

* `form.doc(field)` - Pass a single string argument to get only a single field from the doc.

```js
form.doc('firstName') // -> 'joe'
```

* `form.doc(doc)` - Pass an object or null to set the whole doc

```js
form.doc({ _id: 'new' })
form.doc() // -> { _id: 'new' }
```

* `form.doc(field, value)` - Pass two arguments to set a single field, if the document does not exist, this method will create an empty doc first.

```js
form.doc('firstName', 'sam')
form.doc() // -> { _id: 'new', firstName: 'sam' }
```

* `form.get()` - Use this method to reactively get the doc with the user's input. Should return a javascript object, or null/undefined.

```js
form.get() // -> { firstName: 'joe', lastName: 'smith' }
```

* `form.get(field)` - Pass a single string argument to get only a single field from the doc.

```js
form.get('firstName') // -> 'joe'
```

* `form.set(doc)` - Pass an object or null to set the whole doc

```js
form.set({ _id: 'new' })
form.get() // -> { _id: 'new' }
```

* `form.set(field, value)` - Pass two arguments to set a single field

```js
form.set('firstName', 'sam')
form.get() // -> { _id: 'new', firstName: 'sam' }
```

####Access the schema

You can get and set the schema the same way you can get and set the doc.

The schema is just an object, and the Forms package does not check it for any particular structure, currently we provide some default validation which expects fields in the schema to match fields in the doc, e.g. if you want to validate `doc.firstName` you would set `schema.firstName` as appropriate, however we have plans to change validation to be more pluggable, at which point we will probably deprecate getting/setting individual fields on the schema.

* `form.schema()` - Use this method to reactively get the schema. Should return a javascript object, or null/undefined.

```js
form.schema() // -> { firstName: 'joe', lastName: 'smith' }
```

* `form.schema(field)` - Pass a single string argument to get only a single field from the schema.

```js
form.schema('firstName') // -> 'joe'
```

* `form.schema(schema)` - Pass an object or null to set the whole schema

```js
form.schema({ _id: 'new' })
form.schema() // -> { _id: 'new' }
```

* `form.schema(field, value)` - Pass two arguments to set a single field

```js
form.schema('firstName', 'sam')
form.schema() // -> { _id: 'new', firstName: 'sam' }
```

####Access errors

The Forms package stores errors in a null-backed collection, you can get and set errors using the forms api.

> **NOTE: The `errors`, `error`, `isValid`, and `isInvalid` methods do not validate the form, instead they return results based on the current state of the errors collection, which is normally updated via the `form.validate` method, so in effect they return results based on the last time the form was validated. This allows you to control when validation happens without giving up the ability to reactively display validation errors.**

* `form.errors()` - Get all errors in the errors collection.

```js
form.errors() // -> [{name: 'firstName', error: new Error(), message: 'must be a string'}]
```

* `form.errors(fieldName)` - Get all errors related to a particular field

```js
form.errors('firstName') // -> [{name: 'firstName', error: new Error(), message: 'must be a string'}]
```

* `form.errors(errors)` - Remove all existing errors and insert all the specified errors

```js
form.errors([{
  name: 'firstName'
  , error: new Error()
  , message: "I don't like your name"
}])
form.errors() // -> [{name: 'firstName', error: new Error(), message: "I don't like your name"}]
```

* `form.errors(field, errors)` - Remove all existing errors related to a given field and insert all the specified errors. This method will set the name property of each error you insert to match the field you specified.

```js
form.errors('firstName', [{
  error: new Error()
  , message: "I don't like your name"
}])
form.errors() // -> [{name: 'firstName', error: new Error(), message: "I don't like your name"}]
```

* `form.error()` - Get the first error in the errors collection.

```js
form.error() // -> {name: 'firstName', error: new Error(), message: 'must be a string'}
```

* `form.error(field)` - Get the first error in the errors collection related to a given field.

```js
form.error('firstName') // -> {name: 'firstName', error: new Error(), message: 'must be a string'}
```

* `form.isValid()` - Return a boolean indicating the validity of the whole form.

```js
form.errors([]) // remove all errors
form.isValid() // -> true, because there are no errors
```

* `form.isValid(field)` - Return a boolean indicating the validity of a given field.

```js
form.errors('firstName', [{}]) // insert an error
form.isValid('firstName') // -> false, because we just inserted an error
```

* `form.isInvalid()` - Return a boolean indicating the non-validity of the whole form.

```js
form.errors([]) // remove all errors
form.isInvalid() // -> false, because there are no errors
```

* `form.isInvalid(field)` - Return a boolean indicating the non-validity of a given field.

```js
form.errors('firstName', [{}]) // insert an error
form.isInvalid('firstName') // -> true, because we just inserted an error
```

####Access Validation

The Forms package will validate your document on submit, but you can also validate the form at any time by calling `form.validate()`

* `form.validate()` - Validate the form and return a boolean indicating the validity of the form.

```js
form.validate() // -> true, if there are no errors
```

* `form.validate(field)` - Validate a given field and return a boolean indicating the validity of that field.

```js
form.validate('firstName') // -> true, if there are no errors
```

####Triggering Events

The Forms package provides a rich set of events which make it easy for you to react to user input and state changes. (State changes which are triggered by a user action will result in emited events, state changes which are not triggered by a user action are still reactive, but generally do not result in emitted events.) 

The Forms package uses it's own API to emit events, which mean all the event-emitting functionality is available to you as the app developer for customizing the way your forms behave.

Each api method which emits events takes two optional arguments as the last two arguments:

* `eventTarget` - The element which should emit the event, for example on `documentSubmit` the `form` element should be the eventTarget.
* `originalEvent` - The originating event, for example the `change` event which triggers a `propertyChange` event. If you pass this argument, we will check `isDefaultPrevented` and call `preventDefault` to ensure that you don't handle the same event multiple times.

If you don't pass `eventTarget` then none of the following methods will actually trigger an  event, instead they act as aliases for other methods on the api.

* `form.validate(eventTarget, [originalEvent])` - Validates the document and triggers `documentInvalid` if the form is not valid.

```js
Template.myForm.events({
  'click .validate': function (e, template) {
    template.form.validate(e.currentTarget, e);
    template.form.isValid(); // -> false if there are errors
  }
});
```

* `form.validate(fieldName, eventTarget, [originalEvent])` - Validates a field and triggers `propertyInvalid` if the field is not valid. Note that the `propertyInvalid` event won't get triggered unless you validate a field directly, calling `form.validate(eventTarget)` won't trigger any `propertyInvalid` events.

```js
Template.myForm.events({
  'click .validate': function (e, template) {
    template.form.validate('name', e.currentTarget, e);
    template.form.isValid('name'); // -> false if there are errors
  }
});
```

* `form.invalidate(errors, eventTarget, [originalEvent])` - Marks the doc as invalid by inserting the specified errors and triggers `documentInvalid`. This method is equivilent to calling `form.errors` if you don't pass an `eventTarget`.

```js
Template.myForm.events({
  'change': function (e, template) {
    template.form.invalidate([{
      message: 'This form is readonly!'
    }], e.currentTarget, e);
    template.form.isValid(); // -> false because you just inserted an error
  }
});
```

* `form.invalidate(fieldName, errors, eventTarget, [originalEvent])` - Marks the field as invalid by inserting the specified errors and triggers `propertyInvalid`.

```js
Template.myForm.events({
  'change': function (e, template) {
    template.form.invalidate('name', [{
      message: 'This form is readonly!'
    }], e.currentTarget, e);
    template.form.isValid('name'); // -> false because you just added an error
  }
});
```

* `form.change(fieldName, fieldValue, eventTarget, [originalEvent])` - Updates the value of a field on the doc, by setting `doc[fieldName] = fieldValue`, then triggers `documentChange`. This method is equivilent to calling `form.set` if you don't pass an `eventTarget`.

```js
Template.myForm.events({
  'click .toggle': function (e, template) {
    var name = e.currentTarget.name;
    var value = template.form.doc(name);
    template.form.change(name, !value, e.currentTarget, e);
    // updates the doc and triggers `documentChange`
  }
});
```

* `form.change(changes, eventTarget, [originalEvent])` - Updates the value of multiple fields in the doc, by setting` doc[key] = value` for each key in `changes`. This method only calls `documentChange` once.

```js
Template.myForm.events({
  'click .toggle': function (e, template) {
    var name = e.currentTarget.name;
    var value = template.form.doc(name);
    template.form.change(name, !value, e.currentTarget, e);
    // updates the doc and triggers `documentChange`
  }
});
```

* `form.submit(eventTarget, [originalEvent])` - Validates the document and triggers either `documentSubmit` or `documentInvalid` as a result

```js
Template.myForm.events({
  'click .done': function (e, template) {
    template.form.submit(e.currentTarget, e);
    // triggers `documentSubmit` or `documentInvalid`
  }
});
```

###Forms Events

The Forms package emits events so you can take action when things change. Events are emitted by the Forms package either as a result of some user action which we catch (via `submit` or `change` events), or as a result of some custom event which you trigger, either via the `propertyChange` event, or by using the event emitting api methods above.

```js
Template.myForm.events({
  'propertyChange': function (e, tmpl, changes) {
    // This event is the only event which is not triggered using our api
    // instead we trigger this event in response to `change` events so that
    // we can handle both user initiated `change` events and developer
    // initiated `propertyChange` events using a single unified handler and api
    // See the source code for more info: lib/forms.js:444
    
    // If you want to be notified of property changes, you should use the
    // documentChange event below.
  }
  , 'documentChange': function (e, tmpl, doc, changes) {
    // This event is triggered whenever the doc is updated via `form.change`
    // doc contains the updated doc, including any changes made
    // changes contains only the properties which were updated
  }
  , 'propertyInvalid': function (e, tmpl, doc, errors) {
    // This event is triggered when the developer calls
    // `form.validate(fieldName)` or `form.invalidate(fieldName)`
    // errors is an array of relevant errors
  }
  , 'documentInvalid': function (e, tmpl, doc, errors) {
    // This event is triggered when the document is invalidated via an event
    // There are quite a few ways this could be triggered:
    // - `submit` event
    // - `form.invalidate`
    // - `form.validate`
    // - `form.submit`
  }
  , 'documentSubmit': function (e, tmpl, doc) {
    // This event is triggered either via the `submit` event or by calling
    // `form.submit`, but in both cases only if the document is valid
  }
})
```

Each of the events we list above (with the exception of `propertyChange`) is emitted via our own API, which means when you call any of the methods in [Triggering Events](#triggering-events) your code will emit events in a manner that is consistent with the way that native Forms code emits events.

Important Note about `propertyChange`: In general we recommend interacting with the Forms package through the API, however you might find yourself building a custom component where it's tricky to get the form instance, (e.g. when writing a custom component), in these cases the `propertyChange` event makes it easy for you to trigger changes to the underlying state of the form just use `$(myDomElement).trigger('propertyChange', { key: value })` to let the form instance know that things have changed.


###Events which are handled by Forms
------------

The Forms package tries to be as minimally-invasive as possible, so we don't handle a whole crowd of events, but to make it really easy to handle most use cases, we do handle 3 events by default.

```js
// Read the source code, it's only 10 lines longer than this explanation :)
Forms.events({
  'change input, change textarea, change select': function (e, tmpl) {
    // Creates an object `changes` and triggers 'propertyChange' with
    // `changes` as the first argument
    }
  }
  , 'propertyChange': function (e, tmpl, changes) {
    // calls form.change passing in `changes` as the first argument
    // notice that this event is triggered by the `change` event
  }
  , 'submit': function (e, tmpl) {
    // calls form.submit
  }
});
```

Note: If you're doing something custom and don't want these events, you can pass `events: false` like this: `Forms.mixin(Template.customForm, { events: false })`

