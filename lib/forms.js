Forms = {};

  // XXX doc: doc pulled reactively from template data context
Forms.onCreated = function () {
  var tmpl = this;
  tmpl.doc = new ReactiveVar();
  tmpl.errors = new Mongo.Collection(null);
  tmpl.autorun(function () {
    var data = Template.currentData();
    tmpl.doc.set(data && data.doc);
  });
};

  // XXX doc: wrapper for getView() lookup - consider changing name
  // https://github.com/meteor/meteor/blob/devel/packages/blaze/lookup.js#L123
Forms.call = function (methodName) {
  var args = _.toArray(arguments).slice(1);
  return Blaze.getView().lookup(methodName).apply(this, args);
};

// XXX doc: get form field value
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

// XXX doc: set form field value
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
  * @public
  * @param string type event to be triggered
  * @param string element DOM element to trigger event onto
  * @param object data Current template instance data context.
  * @returns {undefined}
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

// XXX doc: trigger a documentChange event.
  // To be used for reactive update of view if document has been changed
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

// XXX doc: helper
Forms.selector = function (name) {
  return {
    name: name
  };
};

  // Forms.validate = function (doc, schema) {
  //   doc = doc || {};
  //   var tmpl = Template.instance();
  //   tmpl.errors.remove({});
  //   if (schema){
  //     var errors = _.chain(schema)
  //       .map(function (validator, propertyName) {
  //         return {
  //           name: propertyName
  //           , error: validator && validator(doc[propertyName])
  //         };
  //       })
  //       .filter(function (result) {
  //         var val = result.error;

  //         // return only invalid responses, e.g. false, or some message
  //         // true (the object was valid) and null or undefined (no validation
  //         // to perform) both indicate that the validation succeeded.
  //         return !(val === true || val === undefined || val === null);
  //       })
  //       .each(function (result) {
  //         if (!result.error)
  //           result.error = 'invalid';
  //         tmpl.errors.insert(result);
  //       })
  //       ;
  //     return !tmpl.errors.find().count();
  //   } else
  //     return true;
  // };

// XXX doc: schema is either a function (custom validator) or an object of key-value pairs defining one of the built-in validators.
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

// XXX doc:
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

//XXX doc: captures a "submit" jquery event, validates form and triggers respective results event.
  // [JO] handles a submit event
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
}

Forms.events = {
  'change, propertyChange': function (e, tmpl) {
    console.log("Forms change, propertyChange event called. defaultPrevent: "+e.isDefaultPrevented());
    if (e.isDefaultPrevented())
      return;
    e.preventDefault();

    Forms.change(e, tmpl);
  }
  , 'submit form': function (e, tmpl) {
    // Check if user specifically wants to override forms handler
    console.log("Forms submit event called. defaultPrevent: "+e.isDefaultPrevented());
    if (e.isDefaultPrevented())
      return;

    // Prevent default, we don't want the browser's default handling to happen.
    e.preventDefault();

    Forms.submit(e, tmpl);
  }
};

Forms.mixin = function (template) {
  template.onCreated(Forms.onCreated);
  template.helpers(Forms.helpers);
  template.events(Forms.events);
};
