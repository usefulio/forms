Forms = {};

Forms.onCreated = function () {
  var tmpl = this;
  tmpl.doc = new ReactiveVar();
  tmpl.errors = new Mongo.Collection(null);

  tmpl.autorun(function () {
    var data = Template.currentData();
    tmpl.doc.set(data && data.doc);
  });
};


/** Wrapper for Blaze.getView().lookup
  * Used to create a reactive connection with an element of the template instance
  * context.
  * @method Forms.call
  * @where {client}
  * @private
  * @param {String} property Can be a helper of the current template, the name of a template, a global helper or a property of the data context.
  * @returns {function -or- value -or- null} If the return value has reactive dependencies the method will return a function.
  *
  * See (https://github.com/meteor/meteor/blob/devel/packages/blaze/lookup.js#L123)
  * for more.
  */
Forms.call = function (methodName) {
  var args = _.toArray(arguments).slice(1);
  return Blaze.getView().lookup(methodName).apply(this, args);
};


/** Get the value of a specific field from a document.
  * @method Forms.get
  * @where {client}
  * @public
  * @param {Object} document The document object.
  * @param {String} name The name of the field to be retrieved.
  * @returns {depends on value type} The value of the field or `undefined` if not found.
  */
Forms.get = function (doc, name) {
  check(name, String);
  var part;
  var names = name.split(/[\[\]\.]/g);
  // XXX consider: http://stackoverflow.com/questions/17578725/underscore-js-findwhere-nested-objects
  // check referenced article in above link too.
  while (doc && names.length) {
    part = names.shift();
    if (part)
      doc = doc[part];
  }
  if (names.length)
    return undefined;
  else
    return doc;
};


/** Set the value of a field in a document.
  * @method Forms.set
  * @where {client}
  * @public
  * @param {Object} document The document object.
  * @param {String} name The name of the field to be updated.
  * @param {depends on value type} value The new value of the field.
  * @returns {depends on value type} The new value of the field.
  */
Forms.set = function (doc, name, value) {
  doc = doc || {};

  check(name, String);
  check(doc, Object);

  var token;
  var parts;
  var remainder = name;
  var child = doc;
  // XXX: check if this can be refactored.
  while (remainder) {
    token = remainder.match(/[\[\].]+/);
    token = token && token[0];
    if (token) {
      parts = remainder.split(token);
      name = parts.shift();
      remainder = remainder.substr(name.length + token.length);
    } else {
      name = remainder;
      remainder = null;
    }
    if (token && !child[name]) {
      child[name] = token === "[" ? [] : {};
    }

    if (remainder)
      child = child[name];
    else
      child[name] = value;
  }

  return doc;
};


/** Triggers a jquery event on a DOM element.
  * Primarily used by Forms package to update the doc when a user has modified one of the form fields.
  * @method Forms.trigger
  * @where {client}
  * @private
  * @param String type event to be triggered
  * @param String element DOM element to trigger event onto
  * @param object data Current template instance data context.
  *
  * Example:
  * ```
  * Forms.trigger('documentChange', e.currentTarget, { doc: doc });
  * ```
  */
Forms.trigger = function (type, element, data) {
  var eventToTrigger = $.Event(type);
  _.extend(eventToTrigger, data);
  $(element).trigger(eventToTrigger);
};


/** Handles a "change" event, reactively updates the values of the internal Forms
  * document when a form field value changes and triggers the documentChange
  * event handler.
  * @method Forms.change
  * @where {client}
  * @public
  * @param {Object} event An object with information about the event, as passed in Event Map handlers.
  * @param {Object} templateInstance A Blaze.TemplateInstance object which includes a <form></form> section, as passed in Event Map handlers.
  */
Forms.change = function (e, tmpl) {
  var propertyName = e.currentTarget.name;
  var propertyValue = e.currentTarget.value;

  if (!_.isUndefined(e.propertyName)) {
    propertyName = e.propertyName;
  }
  if (!_.isUndefined(e.propertyValue)) {
    propertyValue = e.propertyValue;
  }

  if (propertyName) {
    var doc = tmpl.doc.get();
    doc = Forms.set(doc, propertyName, propertyValue);
    tmpl.doc.set(doc);

    Forms.trigger('documentChange', e.currentTarget, {
      doc: doc
    });
  }
};


/** Handles a "submit" event, validates form, generates errors and triggers the
  * documentSubmit or documentInvalid event handler respectively.
  * @method Forms.submit
  * @where {client}
  * @public
  * @param {Object} event An object with information about the event, as passed in Event Map handlers.
  * @param {Object} templateInstance A Blaze.TemplateInstance object which includes a <form></form> section, as passed in Event Map handlers.
  */
  */
Forms.submit = function (e, tmpl) {
  // Attach the document, in case the user has some custom handling they
  // want to happen regardless of form validation.

  var doc = tmpl.doc.get();
  e.doc = doc;

  var isValid = Forms.validate(doc, Forms.call('schema'));

  if (isValid)
    Forms.trigger('documentSubmit', e.currentTarget, {
      doc: doc
    });
  else {
    var errors = Forms.call('errors');
    e.errors = errors;
    Forms.trigger('documentInvalid', e.currentTarget, {
      doc: doc
      , errors: errors
    });
  }
};


/** Creates a mongo selector object for 'name' attribute
  * @method Forms.selector
  * @where {client}
  * @private
  * @param {String} name The value for the `name` attribute.
  * @returns {Object} The selector object with `name` attribute set to the value of the parameter.
  */
Forms.selector = function (name) {
  return {
    name: name
  };
};


/** Validates all fields based on the declared document schema
  * @method Forms.validate
  * @where {client}
  * @public
  *
  * @param {Object} document The document object to be validated.
  * @param {Object} schema A schema object.
  * @return {Number} The number of validation errors detected.
  *
  * The schema object has the following format:
	* ```js
  * var schema = {
  * 	fieldNameA: {
  * 		validatorA : options,
  * 		validatorB : options
  * 	}
  * 	fieldNameB: {
  * 		validator : options
  * 	}
  * ...
  * }
  * ```
  *
  * `validator` can be either one of the built-in validators or a custom function.
  *
  * Built-in validators include:
  * - oneOf (Collections) Allow only elements in collection
  * - min (Number)
  * - max (Number)
  * - type String, Number, Boolean, Date, Object, Array
  * - minLength (Strings)
  * - maxLength (Strings)
  * - minCount (Arrays)
  * - maxCount (Arrays)
  * - regex: Can take a regex or { pattern: "asdf", flags: "i" } or an array of either
  * - before: (Number or Date)
  * - after: (Number or Date)
  *
  * A custom validator is a function which accepts one Object attribute with two parameters `value` and `options`.
  * `value` holds the value of the field and `options` contain any other data necessary for the validator logic.
  * For example:
  *
  * ```js
  * var myCustomMinValidator = function(context){
  * 	return _.isNumber(context.value) && context.value >= context.options;
  * };
  * ```
  */
Forms.validate = function (doc, schema) {
  var tmpl = Template.instance();
  tmpl.errors.remove({});

  if (!schema)
    return true;

  _.each(doc, function(value, key){
    // look up the validations to be run
    var validator = schema[key];

    if (_.isFunction(validator)) {
      var error = validator(value); // error can be true, false, error message, object or JS Error.
      var isInvalid = !(error === true || error === undefined || error === null);
      if (isInvalid) {
        error = error || 'invalid';
        tmpl.errors.insert({
          name: key
          , error: error
          , message: error
        });
      }
    } else {
      _.each(_.omit(schema[key]/*, specialKeys*/,[]), function(options, ruleName){
        // Check if validation rule in 'ruleName' is a valid built-in validator name
        // in practice an error would be thrown in the if statement below.
        // However this "redundancy" allows for more informative error message and handling.
        if (!_.has(Forms.validators, ruleName))
          throw new Meteor.Error('unknown-validation-rule','Validation rule "'+ruleName+'" does not exist.');

        // run the validations and set the errors.
        var context = {
          value: value
          , fieldName: key
          , options: options
          , values: doc
          , validators: Forms.validators // allows overloading
        };

        if(!Forms.validators[ruleName](context)){
          tmpl.errors.insert({
            name: key
            , error: ruleName
            , message: schema[key].message
          });
        }
      });
    }
  });

  return !tmpl.errors.find().count();
};


/** Spacebars helpers available in a Forms-enabled Meteor template
  * * Forms template helpers
  * @public
  *
  * - doc: Reactively returns the document object
  * - value(name): Reactively returns field `name`'s value
  * - errors: Reactivrly returns a collection of validation errors
  * - error(name): Reactively returns any error messages for field `name`
  * - isValid(name): Returns true if field `name` validation test passes or false otherwise.
  * - isInvalid(name): Return true if field `name` validation test fails or false otherwise.
  * - form: returns all helpers under the `form.` namespace (e.g. form.errors)
  */
Forms.helpers = {
  doc: function () {
    var tmpl = Template.instance();
    return tmpl.doc.get();
  }
  , value: function (name) {
    return Forms.get(Forms.call('doc'), name);
  }
  , errors: function () {
    var tmpl = Template.instance();
    return tmpl.errors.find().fetch();
  }
  , error: function (name) {
    var tmpl = Template.instance();
    var error = tmpl.errors.findOne(Forms.selector(name));
    return error && error.error;
  }
  , isValid: function (name) {
    var error = Forms.call('error', name);
    return !error;
  }
  , isInvalid: function (name) {
    var error = Forms.call('error', name);
    return !!error;
  }
  , form: function () {
    var tmpl = Template.instance();
    var helpers = {};
    _.each(Forms.helpers, function (helper, name) {
      helpers[name] = function () {
        var args = _.toArray(arguments);
        // var elem = tmpl.$('form')[0] || tmpl.$('div')[0];
        // var view = Blaze.getView(elem);
        var self = this;
        return Blaze._withCurrentView(tmpl.view, function () {
          return Forms.call.apply(self, [name].concat(args));
        });
      };
    });
    return helpers;
  }
};


/** @method Template Event helpers
  * @where {client}
  * @public
  * Forms package captures and handles 'change', 'propertyChange' and 'submit'
  * events by default.
  * The event handlers call the respective Forms methods in order to validate
  * the fields and to update the reactive document that Forms package uses to
  * store form data internally.
  * The handlers can be disabled during Forms mixin initialization (XXX REF)
  * using the options parameter of Forms.mixin method.
  * Both events respect preventDefault event property (i.e. do nothing if
  * preventDefault is set).
  */
Forms.events = {
  'change, propertyChange': function (e, tmpl) {
    if (e.isDefaultPrevented())
      return;

    e.preventDefault();

    //http://stackoverflow.com/a/24252333/2391620 default cannot be prevented for change events
    e.stopPropagation();

    Forms.change(e, tmpl);
  }
  , 'submit': function (e, tmpl) {
    if (e.isDefaultPrevented())
      return;

    e.preventDefault();

    Forms.submit(e, tmpl);
  }
};


/** The starting point for adding Forms magic to your form template.
  * Attaches Forms event helpers, template helpers and initializes the internal document and error management.
  * @method Forms.mixin
  * @where {client}
  * @public
  * @param {object} templateInstance A Blaze.TemplateInstance object which includes a <form></form> section.
  * @param {object} [options] Lets you disable any of the following: event handlers (XXX ref), template helpers (XXX ref) and/or the initialization methods which will be attached to the Template instance. Useful if you want to create fully custom logic.
  * @param {boolean} [options.events = true] Enables/disables the Forms event handlers for `change` and `submit` type events. If disabled you need to manually notify Forms when any of the form field values is changed or when the form is submitted for validation logic to work.
  * @param {boolean} [options.helpers = true] Enables/disables the template helpers (XXX ref). If disabled the helpers are not attached to the template at all.
  * @param {boolean} [options.initialize = true] Enables/disables the initialization function attached to the onCreated hook of your template. Only disable if you provide a custom initialization function otherwise it will disable all functionality.
  * @returns {undefined}
  *
  * #### Common usage:
  *
  * _myForm.html_
  * ```html
  * <template name="myForm">
  * 	<form>
  * 		// form elements
  * 	</form>
  * </template>
  * ```
  * _myForm.js_
  * ```js
  * Forms.mixin(Template.myForm);
  * ```
  *
  */
Forms.mixin = function (template, options) {
  options = _.defaults({}, options, {
    events: true
    , helpers: true
    , initialize: true
  });

  if (options.initialize)
    template.onCreated(Forms.onCreated);

  if (options.helpers)
    template.helpers(Forms.helpers);

  if(options.events)
    template.events(Forms.events);
};
