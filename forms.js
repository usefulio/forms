/*
 * Forms - What I want
 * ==========
 *
 * I want a reactive form that handles:
 *  - validation with or without schemas
 *  - deeply nested objects and arrays
 *  - conflicts between the outer reactive context and the current state
 *
 * I want to be able to use templates, or not, as I please
 * I want to be able to access the validation/schema/etc. context
 *
 *
 * Forms - api
 * ==========
 *
 * The forms mixin and related helpers should provide these properties:
 * doc - the current document (e.g. the doc, or a sub-document)
 * name - the current property (e.g. 'firstName', or 'profile')
 * schema - the schema for the current document
 * config - an object with misc options (e.g. auto-submit)
 * others - this list is extendable, you can use mixins/onCreated functions to extend
 * these helpers
 *
 * Forms - events
 * =========
 *
 * The forms mixin and related helpers should trigger/handle these events:
 * propertyChange - a child property has changed
 *     .propertyValue - the value which was changed, generally speaking this value should === this.doc
 *     .propartyName - the name of the property which was changed
 *
 *     custom forms and sub-document templates should handle this event in order to modify the current
 *     custom input templates should trigger this event to signal a change in the user-entered value
 *
 *     if you handle this event (e.g. assign propertyValue to doc[propartyName]) you should call e.preventDefault()
 *     you should not handle this event if e.defaultPrevented() = true;
 *
 *     this event fires regardless of validation
 *
 * documentChange - a form document has changed, including sub-documents
 *     .doc - the value which was changed, generally speaking this value should === this.doc
 *     .validationErrors - null or an array of errors.
 *
 *     custom validation can use e.pushValidationError(error) to log an error and prevent documentSubmit
 *     from firing, you can also use e.preventDefault to prevent documentSubmit from firing for some other reason.
 *
 *     this event fires regardless of validation
 *     this event fires regardless of whether the form was submitted
 *
 * documentSubmit - a form document has been submitted, and is valid
 *     .doc - an object containing all submitted input
 *     .sourceEvent - the event which triggered submit (generally a native submit event, or documentChange, if auto-submit is enabled)
 *
 *     perform your submit action here, e.g. insert or update
 *
 *     this event fires only if the document is valid
 *     
 * documentInvalid - a form document has been submitted, and is invalid
 *     .doc
 *     .sourceEvent
 *     .validationErrors
 *
 *     perform custom validation handling here
 *
 *     this event fires only if the document is not valid
 */

Forms = {};

Forms.submit = function (e, tmpl) {
  var doc = tmpl.doc.get() || {};
  var schema = tmpl.data && tmpl.data.schema;
  var isValid = true;

  if (schema && typeof schema.validate === "function")
    isValid = Schema.validate(doc, schema);

  var newEvent;
  if (isValid !== true) {
    e.validationErrors = isValid;
    newEvent = $.Event('documentInvalid');
    newEvent.validationErrors = isValid;
  } else {
    newEvent = $.Event('documentSubmit');
  }

  newEvent.doc = tmpl.doc.get() || {};
  newEvent.form = Forms.helpers.documentSubmit(e, tmpl);
  newEvent.sourceEvent = e;
  $(e.currentTarget).trigger(newEvent);
};

Forms.change = function (e, tmpl) {
  var propertyName = e.currentTarget.name;
  var propertyValue = e.currentTarget.value;

  if (typeof e.propertyName !== "undefined" || e.type !== 'change') {
    propertyName = e.propertyName;
  }
  if (typeof e.propertyValue !== "undefined" || e.type !== 'change') {
    propertyValue = e.propertyValue;
  }

  if (propertyName) {
    var doc = this.doc || {};
    doc[propertyName] = propertyValue;

    var documentChange = $.Event('documentChange');
    documentChange.doc = doc;

    $(e.currentTarget).trigger(documentChange);
  }
};

Forms.error = function (schema, value) {
  var valid = true;
  if (schema && (value || this.dirty))
    valid = schema.validate(value);
  if (valid === true)
    return null;
  else
    return valid || new Error('invalid');
};

Forms.helpers = {
  form: function () {
    var doc = Template.instance().doc.get();
    var dirty = Template.instance().dirty.get();
    return _.defaults({
      doc: doc
      , error: function (fieldName) {
        var schema = Schema.child(this.schema, fieldName);
        var value = (doc || {})[fieldName];
        return Forms.error.call(this, schema, value);
      }
      , dirty: dirty
    }, this);
  }
  , field: function () {
    var parent = Template.parentData() || {};
    var value = (parent.doc || {})[this.name];
    var schema = Schema.child(parent.schema, this.name);
    var context = {
      value: value
      , schema: schema
      , error: function () {
        return Forms.error.call(this, schema, value);
      }
      , dirty: parent.dirty
      , doc: parent.doc
    };
    _.extend(context, this);
    return context;
  }
  , subdoc: function () {
    var outer = Template.parentData();
    var doc = (outer.doc || {})[this.name]
    var schema = Schema.child(outer.schema, this.name);
    var error = Forms.error.call(this, schema, doc);

    return _.defaults({
      doc: doc
      , schema: schema
      , error: error
      , dirty: outer.dirty
    }, this);
  }
  , arrayitem: function () {
    var outer = this;
    var doc = (this.doc || [])[this.index];
    var schema = Schema.child(outer.schema, this.index);
    var error;
    if (schema) {
      try {
        var valid = schema.validate(doc);
        if (valid !== true)
          error = valid || new Error('invalid');
      } catch (e) {
        error = e;
      }
    }
    return {
      doc: doc
      , schema: schema
      , error: error
      , dirty: outer.dirty
    };
  }
  , arrayeach: function () {
    var self = this;
    return _.map(self.doc, function (a, i) {
      return _.extend({
        index: i
      }, self);
    });
  }
  , documentSubmit: function () {
    return {
      clear: function () {
        var clearFormEvent = new $.Event('documentChange');
        clearFormEvent.doc = {};
        $(e.currentTarget).trigger(clearFormEvent);
      }
    };    
  }
};

Forms.events = {
  form: {
    'documentChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;
      e.preventDefault();

      tmpl.doc.set(e.doc);
    }
    , 'submit form': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;
      e.preventDefault();

      tmpl.dirty.set(true);
      Forms.submit.call(this, e, tmpl);
    }
    , 'change, propertyChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;
      e.preventDefault();

      Forms.change.call(this, e, tmpl);
    }
  }
  , subdoc: {
    'documentChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;

      tmpl.data.doc = tmpl.data.doc || {};
      tmpl.data.doc[tmpl.data.name] = e.doc;
      e.doc = tmpl.data.doc;
    }
  }
  , arrayitem: {
    'documentChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;

      tmpl.data.doc = tmpl.data.doc || [];
      tmpl.data.doc[tmpl.data.index] = e.doc;
      e.doc = tmpl.data.doc;
    }
  }
};

Template.form.onCreated(function () {
    var tmpl = this;
    tmpl.doc = new ReactiveVar();
    tmpl.dirty = new ReactiveVar();

    tmpl.autorun(function () {
      var data = Template.currentData();
      tmpl.doc.set(data && data.doc);
      tmpl.dirty.set(false);
    });
});

Template.form.helpers({
  context: function () {
    return Forms.helpers.form.apply(this);
  }
});

Template.form.events(Forms.events.form);

Template.field.helpers({
  context: function () {
    return Forms.helpers.field.apply(this);
  }
});

Template.subdoc.helpers({
  context: function () {
    return Forms.helpers.subdoc.apply(this);
  }
});

Template.subdoc.events(Forms.events.subdoc);

Template.arrayeach.helpers({
  items: function () {
    return Forms.helpers.arrayeach.apply(this);
  }
});

Template.arrayitem.helpers({
  context: function () {
    return Forms.helpers.arrayitem.apply(this);
  }
});

Template.arrayitem.events(Forms.events.arrayitem);

