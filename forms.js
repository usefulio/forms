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
  newEvent.sourceEvent = e;
  $(e.currentTarget).trigger(newEvent);
};

Forms.mixin = function (template) {
  template.events({
    'change, propertyChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;
      e.preventDefault();

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
    }
  });
};

Forms.formMixin = function (template) {
  template.onCreated(function () {
    var tmpl = this;
    tmpl.doc = new ReactiveVar();
    // tmpl.schema = new ReactiveVar();

    // XXX store dirty state
    // XXX store form validation state

    tmpl.autorun(function () {
      var data = Template.currentData();

      // XXX handle dirty state
      if (data) {
        tmpl.doc.set(data.doc);
        // tmpl.schema.set(data.schema);
      }
    });
  });

  template.helpers({
    doc: function () {
      var tmpl = Template.instance();
      return tmpl.doc.get();
    }
  });

  template.events({
    'documentChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;
      e.preventDefault();

      tmpl.doc.set(e.doc);

      // XXX auto-submit
      // XXX reset error state
      // XXX log errors
      // XXX auto-submit
    }
    , 'submit form': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;
      e.preventDefault();

      Forms.submit(e, tmpl);
    }
  });

  Forms.mixin(template);
};

Forms.subDocMixin = function (template) {
  template.events({
    'documentChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;

      tmpl.data.doc = tmpl.data.doc || {};
      tmpl.data.doc[tmpl.data.name] = e.doc;
      e.doc = tmpl.data.doc;
    }
  });

  template.helpers({
    doc: function () {
      var outer = Template.parentData();
      return (outer.doc || {})[this.name];
    }
    , schema: function () {
      var outer = Template.parentData();
      return Schema.child(outer.schema, this.name);
    }
    , error: function () {
      var outer = Template.parentData();
      var schema = Schema.child(outer.schema, this.name);
      var doc = (outer.doc || {})[this.name];
      var valid = true;
      if (schema)
        valid = schema.validate(doc);
      if (valid === true)
        return null;
      else
        return valid || new Error('invalid');
    }
  });  
};

Forms.arrayItemMixin = function (template) {
  template.events({
    'documentChange': function (e, tmpl) {
      if (e.isDefaultPrevented())
        return;

      tmpl.data.doc = tmpl.data.doc || [];
      tmpl.data.doc[tmpl.data.index] = e.doc;
      e.doc = tmpl.data.doc;
    }
  });

  template.helpers({
    doc: function () {
      return (this.doc || [])[this.index];
    }
    , error: function () {
      var outer = this;
      var schema = Schema.child(outer.schema, this.index);
      var doc = (outer.doc || {})[this.name];
      var valid = true;
      if (schema)
        valid = schema.validate(doc);
      if (valid === true)
        return null;
      else
        return valid || new Error('invalid');
    }
  });  
};

Forms.arrayEachMixin = function (template) {
  template.helpers({
    items: function () {
      var self = this;
      return _.map(self.doc, function (a, i) {
        return _.extend({
          index: i
        }, self);
      });
    }
  });
};

Forms.fieldMixin = function (template) {
  template.helpers({
    context: function () {
      var parent = Template.parentData();
      var context = {
        value: function () {
          return parent.doc[context.name];
        }
        , schema: function () {
          return Schema.child(parent.schema, context.name);
        }
        , error: function () {
          var schema = context.schema();
          var valid = true;
          if (schema)
            valid = schema.validate(context.value);
          if (valid === true)
            return null;
          else
            return valid || new Error('invalid');
        }
      };
      _.extend(context, this);
      return context;
    }
  });
};
