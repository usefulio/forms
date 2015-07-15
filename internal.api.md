## Public and Private API ##

_API documentation automatically generated by [docmeteor](https://github.com/raix/docmeteor)._

***

__File: ["lib/forms.js"](lib/forms.js) Where: {client}__

***

### <a name="Forms.call"></a>*Forms*.call(property)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Wrapper for Blaze.getView().lookup
Used to create a reactive connection with an element of the template instance
context.
```
*This method is private*
*This method __call__ is defined in `Forms`*

__Arguments__

* __property__ *{String}*  

 Can be a helper of the current template, the name of a template, a global helper or a property of the data context.


__Returns__  *{function -or- value -or- null}*
If the return value has reactive dependencies the method will return a function.

See (https://github.com/meteor/meteor/blob/devel/packages/blaze/lookup.js#L123)
for more.

> ```Forms.call = function (methodName) { ...``` [lib/forms.js:27](lib/forms.js#L27)


-

### <a name="Forms.get"></a>*Forms*.get(document, name)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Get the value of a specific field from a document.
```
*This method __get__ is defined in `Forms`*

__Arguments__

* __document__ *{Object}*  

 The document object.

* __name__ *{String}*  

 The name of the field to be retrieved.


__Returns__  *{depends on value type}*
The value of the field or `undefined` if not found.

> ```Forms.get = function (doc, name) { ...``` [lib/forms.js:41](lib/forms.js#L41)


-

### <a name="Forms.set"></a>*Forms*.set(document, name, value)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Set the value of a field in a document.
```
*This method __set__ is defined in `Forms`*

__Arguments__

* __document__ *{Object}*  

 The document object.

* __name__ *{String}*  

 The name of the field to be updated.

* __value__ *{[depends on value type](#depends on value type)}*  

 The new value of the field.


__Returns__  *{depends on value type}*
The new value of the field.

> ```Forms.set = function (doc, name, value) { ...``` [lib/forms.js:68](lib/forms.js#L68)


-

### <a name="Forms.trigger"></a>*Forms*.trigger(type, element, data)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Triggers a jquery event on a DOM element.
Primarily used by Forms package to update the doc when a user has modified one of the form fields.
```
*This method is private*
*This method __trigger__ is defined in `Forms`*

__Arguments__

* __type__ *{String}*  

 event to be triggered

* __element__ *{String}*  

 DOM element to trigger event onto

* __data__ *{object}*  

 Current template instance data context.


Example:
```
Forms.trigger('documentChange', e.currentTarget, { doc: doc });
```

> ```Forms.trigger = function (type, element, data) { ...``` [lib/forms.js:118](lib/forms.js#L118)


-

### <a name="Forms.change"></a>*Forms*.change(event, templateInstance)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Handles a "change" event, reactively updates the values of the internal Forms
document when a form field value changes and triggers the documentChange
event handler.
```
*This method __change__ is defined in `Forms`*

__Arguments__

* __event__ *{Object}*  

 An object with information about the event, as passed in Event Map handlers.

* __templateInstance__ *{Object}*  

 A Blaze.TemplateInstance object which includes a <form></form> section, as passed in Event Map handlers.


> ```Forms.change = function (e, tmpl) { ...``` [lib/forms.js:134](lib/forms.js#L134)


-

### <a name="Forms.submit"></a>*Forms*.submit(event, templateInstance)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Handles a "submit" event, validates form, generates errors and triggers the
documentSubmit or documentInvalid event handler respectively.
```
*This method __submit__ is defined in `Forms`*

__Arguments__

* __event__ *{Object}*  

 An object with information about the event, as passed in Event Map handlers.

* __templateInstance__ *{Object}*  

 A Blaze.TemplateInstance object which includes a <form></form> section, as passed in Event Map handlers.


> ```*/``` [lib/forms.js:165](lib/forms.js#L165)


-

### <a name="Forms.selector"></a>*Forms*.selector(name)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Creates a mongo selector object for 'name' attribute
```
*This method is private*
*This method __selector__ is defined in `Forms`*

__Arguments__

* __name__ *{String}*  

 The value for the `name` attribute.


__Returns__  *{Object}*
The selector object with `name` attribute set to the value of the parameter.

> ```Forms.selector = function (name) { ...``` [lib/forms.js:197](lib/forms.js#L197)


-

### <a name="Forms.validate"></a>*Forms*.validate(document, schema)&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Validates all fields based on the declared document schema
```
*This method __validate__ is defined in `Forms`*

__Arguments__

* __document__ *{Object}*  

 The document object to be validated.

* __schema__ *{Object}*  

 A schema object.


__Returns__  *{Number}*
The number of validation errors detected.


The schema object has the following format:
```js
var schema = {
	fieldNameA: {
		validatorA : options,
		validatorB : options
	}
	fieldNameB: {
		validator : options
	}
...
}
```

`validator` can be either one of the built-in validators or a custom function.

Built-in validators include:
- oneOf (Collections) Allow only elements in collection
- min (Number)
- max (Number)
- type String, Number, Boolean, Date, Object, Array
- minLength (Strings)
- maxLength (Strings)
- minCount (Arrays)
- maxCount (Arrays)
- regex: Can take a regex or { pattern: "asdf", flags: "i" } or an array of either
- before: (Number or Date)
- after: (Number or Date)

A custom validator is a function which accepts one Object attribute with two parameters `value` and `options`.
`value` holds the value of the field and `options` contain any other data necessary for the validator logic.
For example:

```js
var myCustomMinValidator = function(context){
	return _.isNumber(context.value) && context.value >= context.options;
};
```

> ```Forms.validate = function (doc, schema) { ...``` [lib/forms.js:252](lib/forms.js#L252)


-

### <a name="Forms.helpers"></a>*Forms*.helpers {any}&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
Spacebars helpers available in a Forms-enabled Meteor template
Forms template helpers
```
*This property __helpers__ is defined in `Forms`*

- doc: Reactively returns the document object
- value(name): Reactively returns field `name`'s value
- errors: Reactivrly returns a collection of validation errors
- error(name): Reactively returns any error messages for field `name`
- isValid(name): Returns true if field `name` validation test passes or false otherwise.
- isInvalid(name): Return true if field `name` validation test fails or false otherwise.
- form: returns all helpers under the `form.` namespace (e.g. form.errors)

> ```Forms.helpers = { ...``` [lib/forms.js:318](lib/forms.js#L318)


-

### <a name="Template"></a>Template()&nbsp;&nbsp;<sub><i>Client</i></sub> ###

Forms package captures and handles 'change', 'propertyChange' and 'submit'
events by default.
The event handlers call the respective Forms methods in order to validate
the fields and to update the reactive document that Forms package uses to
store form data internally.
The handlers can be disabled during Forms mixin initialization (XXX REF)
using the options parameter of Forms.mixin method.
Both events respect preventDefault event property (i.e. do nothing if
preventDefault is set).

> ```Forms.events = { ...``` [lib/forms.js:375](lib/forms.js#L375)


-

### <a name="Forms.mixin"></a>*Forms*.mixin(templateInstance, [options])&nbsp;&nbsp;<sub><i>Client</i></sub> ###

```
The starting point for adding Forms magic to your form template.
Attaches Forms event helpers, template helpers and initializes the internal document and error management.
```
*This method __mixin__ is defined in `Forms`*

__Arguments__

* __templateInstance__ *{object}*  

 A Blaze.TemplateInstance object which includes a <form></form> section.

* __options__ *{object}*  (Optional)

 Lets you disable any of the following: event handlers (XXX ref), template helpers (XXX ref) and/or the initialization methods which will be attached to the Template instance. Useful if you want to create fully custom logic.

    * __events__ *{boolean}*  (Optional, Default = true)

    Enables/disables the Forms event handlers for `change` and `submit` type events. If disabled you need to manually notify Forms when any of the form field values is changed or when the form is submitted for validation logic to work.

    * __helpers__ *{boolean}*  (Optional, Default = true)

    Enables/disables the template helpers (XXX ref). If disabled the helpers are not attached to the template at all.

    * __initialize__ *{boolean}*  (Optional, Default = true)

    Enables/disables the initialization function attached to the onCreated hook of your template. Only disable if you provide a custom initialization function otherwise it will disable all functionality.


__Returns__  *{undefined}*

#### Common usage:

_myForm.html_
```html
<template name="myForm">
	<form>
		// form elements
	</form>
</template>
```
_myForm.js_
```js
Forms.mixin(Template.myForm);
```


> ```Forms.mixin = function (template, options) { ...``` [lib/forms.js:426](lib/forms.js#L426)

