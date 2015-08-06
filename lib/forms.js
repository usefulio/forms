Forms = {
  _onMixin: []
  , _onCreated: []
  , _helpers: {}
  , _methods: {}
};

function makeGetterSetter(variableName) {
  return function () {
    var self = this;

    // Get arguments
    var args = _.toArray(arguments);
    var fieldName, newValue, hasNewValue;
    if (_.isString(args[0]))
      fieldName = args.shift();
    if (args.length) {
      newValue = args.shift();
      hasNewValue = true;
    }
    if (args.length)
      throw new Error("Too many arguments");

    check(fieldName, Match.OneOf(String, undefined));

    // Lazily initalize variable
    if (!self[variableName])
      self[variableName] = new ReactiveVar();

    if (_.isUndefined(fieldName)) {
      // Whole doc operation
      if (hasNewValue) {
        if (!Match.test(newValue, Object))
          throw new Error('Document must be an object');
        self[variableName].set(newValue);
      } else {
        return self[variableName].get();
      }
    } else {
      // Partial doc operation
      if (!fieldName.length)
        throw new Error('Field name must be non-empty string');
      // XXX deeply nested properties
      if (hasNewValue) {
        var doc = Tracker.nonreactive(function () {
          return self[variableName].get();
        });
        doc[fieldName] = newValue;
        self[variableName].set(doc);
      } else {
        return self[variableName].get()[fieldName];
      }
    }
  };
}

function makeErrorsCollection(variableName) {
  return function () {
    var self = this;

    // Get arguments
    var args = _.toArray(arguments);
    var fieldName, newValue, hasNewValue;
    if (_.isString(args[0]))
      fieldName = args.shift();
    if (args.length) {
      newValue = args.shift();
      hasNewValue = true;
    }
    if (args.length)
      throw new Error("Too many arguments");

    check(fieldName, Match.OneOf(String, undefined));

    // Lazily initalize variable
    if (!self[variableName])
      self[variableName] = new Mongo.Collection(null);

    if (_.isUndefined(fieldName)) {
      // Whole doc operation
      if (hasNewValue) {
        if (!_.isArray(newValue))
          throw new Error('Errors must be an array');
        self[variableName].remove({});
        _.each(newValue, function (error) {
          self[variableName].insert(error);
        });
      } else {
        return self[variableName].find().fetch();
      }
    } else {
      // Partial doc operation
      if (!fieldName.length)
        throw new Error('Field name must be non-empty string');

      // XXX deeply nested properties
      var query = {
        name: fieldName
      };
      if (hasNewValue) {
        if (!_.isArray(newValue) && _.isObject(newValue))
          newValue = [newValue];
        if (!_.isArray(newValue))
          throw new Error('Errors must be an array or a single object');
        self[variableName].remove(query);
        _.each(newValue, function (value) {
          self[variableName].insert(_.defaults({name: fieldName}, value));
        });
      } else {
        return self[variableName].find(query).fetch();
      }
    }
  };
}

function makeGetterHelper(methodName) {
  return function (fieldName) {
    var form = this;
    if (_.isString(fieldName))
      return form[methodName](fieldName);
    else
      return form[methodName]();
  };
}

function makeGetter(methodName) {
  return function (fieldName) {
    var form = this;
    if (_.isString(fieldName) && arguments.length === 1)
      return form[methodName](fieldName);
    else if (arguments.length === 0)
      return form[methodName]();
    else
      throw new Error('Argument must be a string, or do not specify any arguments');
  };
}

function makeSetter(methodName) {
  return function (fieldName, value) {
    var form = this;
    if (_.isString(fieldName) && arguments.length === 2)
      return form[methodName](fieldName, value);
    else if (_.isObject(fieldName) && arguments.length === 1) {
      value = fieldName;
      fieldName = null;
      return form[methodName](value);
    } else
      throw new Error('First argument must be a string, or specify only one argument: an object');
  };
}

function makeErrorGetter(collectionName) {
  return function (fieldName) {
    var form = this;
    if (!this[collectionName])
      this[collectionName] = new Mongo.Collection(null);
    if (_.isString(fieldName)) {
      return this[collectionName].findOne({
        name: fieldName
      });
    } else {
      return this[collectionName].findOne();
    }
  };
}

function makeHelpers(helpers, form) {
  var result = {};
  _.each(helpers, function (helper, key) {
    result[key] = function () {
      var form = Forms.instance();
      return helper.apply(form, arguments);
    };
  });
  return result;
}

function isEvent(objectToTest) {
  return objectToTest &&
    _.isFunction(objectToTest.isDefaultPrevented) &&
    _.isFunction(objectToTest.preventDefault);
}

function makeEventTrigger(callback) {
  return function () {
    var form = this;
    var args = _.toArray(arguments);
    var eventTarget, originalEvent;
    if (isEvent(_.last(args))) {
      originalEvent = args.pop();
      if (originalEvent.isDefaultPrevented())
        return;
      originalEvent.preventDefault();
    }
    if (_.isElement(_.last(args))) {
      eventTarget = args.pop();
    }
    var eventData = callback.apply(form, args);
    if (eventTarget && _.isArray(eventData)) {
      var eventName = eventData.shift();
      $(eventTarget).trigger(eventName, eventData);
    }
    return _.last(eventData);
  };
}

// Componetize the Forms component
// ================

Forms.mixin = function (template, options) {
  var self = this;
  _.each(this._onMixin, function (callback) {
    callback.call(self, template, options);
  });
};

Forms.onMixin = function (callback) {
  this._onMixin.push(callback);
};

Forms.onCreated = function (callback) {
  this._onCreated.push(callback);
};


// Actual Forms api
// ================

Forms.instance = function () {
  return Template.instance().form;
};

Forms.helpers = function (helpers) {
  _.extend(this._helpers, helpers);
};

Forms.methods = function (methods) {
  _.extend(this._methods, methods);
};

// Initialize Forms behavior
// ================

Forms.onMixin(function (template, options) {
  var self = this;
  _.each(self._onCreated, function (callback) {
    template.onCreated(callback);
  });
  template.helpers(makeHelpers(self._helpers));
});

Forms.onCreated(function () {
  var tmpl = this;
  tmpl.form = {};

  _.extend(tmpl.form, Forms._helpers);
  _.extend(tmpl.form, Forms._methods);

  tmpl.autorun(function () {
    var data = Template.currentData();
    tmpl.form.doc(data && data.doc ? _.clone(data.doc) : {});
    tmpl.form.schema(data && data.schema ? _.clone(data.schema) : {});
  });
});

Forms.methods({
  doc: makeGetterSetter('_doc')
  , schema: makeGetterSetter('_schema')
  , errors: makeErrorsCollection('_errors')
  , get: makeGetter('doc')
  , set: makeSetter('doc')
  , change: makeEventTrigger(function (propertyName, propertyValue) {
    var form = this;
    var changes = {};
    if (_.isObject(propertyName)) {
      changes = propertyName;
      propertyName = null;
      propertyValue = null;
    } else {
      if (!_.isString(propertyName))
        throw new Error('Property name must be a string');
      changes[propertyName] = propertyValue;
    }
    _.each(changes, function (propertyValue, propertyName) {
      form.doc(propertyName, propertyValue);
    });
    var updatedDoc = Tracker.nonreactive(function () { return form.doc(); });
    return ['documentChange', updatedDoc, changes];
  })
  , invalidate: makeEventTrigger(function (propertyName, errors) {
    var form = this;
    if (_.isArray(propertyName)) {
      if (errors)
        throw new Error("Too many arguments");
      errors = propertyName;
      propertyName = null;
    }
    var updatedDoc, updatedErrors;
    if (!propertyName) {
      form.errors(errors);
      updatedDoc = Tracker.nonreactive(function () { return form.doc(); });
      updatedErrors =  Tracker.nonreactive(function () { return form.errors(); });
      return ['documentInvalid', updatedDoc, updatedErrors];
    } else {
      form.errors(propertyName, errors);
      updatedDoc = Tracker.nonreactive(function () { return form.doc(); });
      updatedErrors =  Tracker.nonreactive(function () { return form.errors(propertyName); });
      return ['propertyInvalid', updatedDoc, updatedErrors];
    }
  })
  , validate: makeEventTrigger(function (propertyName) {
    var form = this;
    if (!arguments.length) {
      propertyName = null;
    } else if (!_.isString(propertyName)) {
      throw new Error("Property name should be a string");
    }
    if (arguments.length > 1) {
      throw new Error("Too many arguments");
    }
    var schema = propertyName ? form.schema(propertyName) : form.schema();
    var errors = _.map(schema, function (rule, propertyName) {
      var value = form.doc(propertyName);
      return {
        error: rule.call(form, value, propertyName)
        , name: propertyName
      };
    });
    errors = _.filter(errors, function (error) {
      return error && error.error !== true && error.error !== null && error.error !== undefined;
    });
    errors = _.map(errors, function (error) {
      if (error.error instanceof Error)
        error.message = error.error.message;
      else {
        error.message = error.error;
        delete error.error;
      }
      return error;
    });
    var updatedDoc, updatedErrors;
    if (!propertyName) {
      form.errors(errors);
      if (errors.length) {
        updatedDoc = Tracker.nonreactive(function () { return form.doc(); });
        updatedErrors =  Tracker.nonreactive(function () { return form.errors(); });
        return ['documentInvalid', updatedDoc, updatedErrors];
      }
    } else {
      form.errors(propertyName, errors);
      if (errors.length) {
        updatedDoc = Tracker.nonreactive(function () { return form.doc(); });
        updatedErrors =  Tracker.nonreactive(function () { return form.errors(propertyName); });
        return ['propertyInvalid', updatedDoc, updatedErrors]; 
      }
    }
    return null;
  })
  , submit: makeEventTrigger(function () {
    var form = this;
    form.validate();
    var updatedDoc = Tracker.nonreactive(function () { return form.doc(); });
    var updatedErrors =  Tracker.nonreactive(function () { return form.errors(); });
    if (updatedErrors.length) {
      return ['documentInvalid', updatedDoc, updatedErrors];
    } else {
      return ['documentSubmit', updatedDoc];
    }
  })
});

Forms.helpers({
  doc: makeGetterHelper('doc')
  , schema: makeGetterHelper('schema')
  , errors: makeGetterHelper('errors')
  , error: makeErrorGetter('_errors')
  , isValid: function () {
    return !this.error.apply(this, arguments);
  }
  , isInvalid: function () {
    return !!this.error.apply(this, arguments);
  }
});

//   // Initializes a form instance. This method attached to a Template class as
//   // part of `Forms.mixin(Template.myTemplate)`
// Forms.onCreated = function () {
//   var tmpl = this;
//   tmpl.doc = new ReactiveVar();
//   tmpl.errors = new Mongo.Collection(null);

//   tmpl.autorun(function () {
//     var data = Template.currentData();
//     tmpl.doc.set(data && data.doc);
//   });
// };

//   // Looks up a name in the current view, so that the forms package has access
//   // to variables as they would exist in a template tag
//   // https://github.com/meteor/meteor/blob/devel/packages/blaze/lookup.js#L123
// Forms.call = function (methodName) {
//   check(methodName, String);

//   var args = _.toArray(arguments).slice(1);
//   return Blaze.getView().lookup(methodName).apply(this, args);
// };

//   // Gets a property of an object by name where name can be a deeply nested
//   // property lookup such as `profile.photos[0].url`
// Forms.get = function (doc, name) {
//   // XXX check(doc, Match.oneOf(Object, undefined));
//   check(name, String);
//   var part;
//   var names = name.split(/[\[\]\.]/g);
//   while (doc && names.length) {
//     part = names.shift();
//     if (part)
//       doc = doc[part];
//   }
//   if (names.length)
//     return undefined;
//   else
//     return doc;
// };

//   // Sets a property of an object by name where name can be a deeply nested
//   // property lookup such as `profile.photos[0].url`. Will create objects or
//   // arrays in the lookup path if they do not exist.
// Forms.set = function (doc, name, value) {
//   doc = doc || {};

//   check(name, String);
//   check(doc, Object);

//   var token;
//   var parts;
//   var remainder = name;
//   var child = doc;
//   while (remainder) {
//     token = remainder.match(/[\[\].]+/);
//     token = token && token[0];
//     if (token) {
//       parts = remainder.split(token);
//       name = parts.shift();
//       remainder = remainder.substr(name.length + token.length);
//     } else {
//       name = remainder;
//       remainder = null;
//     }
//     if (token && !child[name]) {
//       child[name] = token === "[" ? [] : {};
//     }

//     if (remainder)
//       child = child[name];
//     else
//       child[name] = value;
//   }

//   return doc;
// };

// /** Triggers a jquery event with custom defined properties
//   * used by forms.change and forms.submit to trigger forms package events
//   * @method Forms.trigger
//   * @where {client}
//   * @public
//   * @param string type event to be triggered
//   * @param string element DOM element to trigger event onto
//   * @param object data Current template instance data context.
//   * @returns {undefined}
//   *
//   * Example:
//   * ```
//   * Forms.trigger('documentChange', e.currentTarget, { doc: doc });
//   * ```
//   */
// Forms.trigger = function (type, element, data) {
//   // XXX refactor to pass data more normally:
//   //   $(element).trigger(type, doc, tmpl)
//   //   'documentChange': function (e, tmpl, doc, formInstance)
//   var eventToTrigger = $.Event(type);
//   _.extend(eventToTrigger, data);
//   $(element).trigger(eventToTrigger);
// };

//   // The default handler for change events.
//   // Parses a change event and updates the form doc instance accordingly.
//   // Will get the property name and value from e.currentTarget or 
//   // e.propertyName, e.propertyValue if they exist.
//   // Will trigger documentChange event if the document is updated
// Forms.change = function (e, tmpl) {
//   var propertyName = e.currentTarget.name;
//   var propertyValue = e.currentTarget.value;

//   if (!_.isUndefined(e.propertyName)) {
//     propertyName = e.propertyName;
//   }
//   if (!_.isUndefined(e.propertyValue)) {
//     propertyValue = e.propertyValue;
//   }

//   if (propertyName) {
//     var doc = tmpl.doc.get();
//     doc = Forms.set(doc, propertyName, propertyValue);
//     // This works because ReactiveVar will trigger dep.changed() if oldDoc is same object instance as newDoc
//     tmpl.doc.set(doc);

//     Forms.trigger('documentChange', e.currentTarget, {
//       doc: doc
//     });
//   }
// };

//   // The default handler for submit events.
//   // Validates a form and triggers either documentSubmit or documentInvalid.
//   // Also attaches the doc property to the submit event for convenience.
// Forms.submit = function (e, tmpl) {
//   // Attach the document, in case the user has some custom handling they
//   // want to happen regardless of form validation.

//   var doc = tmpl.doc.get();
//   e.doc = doc;

//   var isValid = Forms.validate(doc, Forms.call('schema'));

//   if (isValid)
//     Forms.trigger('documentSubmit', e.currentTarget, {
//       doc: doc
//     });
//   else {
//     var errors = Forms.call('errors');
//     e.errors = errors;
//     Forms.trigger('documentInvalid', e.currentTarget, {
//       doc: doc
//       , errors: errors
//     });
//   }
// };

//   // Takes a property name argument and returns a selector which can be used to
//   // find related errors in the form errors collection
// Forms.selector = function (name) {
//   // XXX support finding sub-document errors, e.g.
//   // if an error for 'profile.name' exists, we might want to return
//   // that errror when searching for 'profile' errors.
//   return {
//     name: name
//   };
// };

//   // Validates doc against schema and inserts any found errors into the errors
//   // collection.
//   // doc can be any object
//   // schema should be an object who's properties are either:
//   // 1. a function, which takes the property value and returns false or throws
//   //    an error if the property is invalid
//   // 2. an object which defines one or more built in validators
// Forms.validate = function (doc, schema) {
//   var tmpl = Template.instance();
//   tmpl.errors.remove({});

//   if (!schema)
//     return true;

//   _.each(doc, function(value, key){
//     // look up the validations to be run
//     var validator = schema[key];

//     if (_.isFunction(validator)) {
//       var error = validator(value); // error can be true, false, error message, object or JS Error.
//       var isInvalid = !(error === true || error === undefined || error === null);
//       if (isInvalid) {
//         error = error || 'invalid';
//         tmpl.errors.insert({
//           name: key
//           , error: error
//           , message: error
//         });
//       }
//     } else {
//       _.each(_.omit(schema[key]/*, specialKeys*/,[]), function(options, ruleName){
//         // Check if validation rule in 'ruleName' is a valid built-in validator
//         // name in practice an error would be thrown in the if statement below,
//         // however we should throw a more informative error message.
//         if (!_.has(Forms.validators, ruleName))
//           throw new Meteor.Error('unknown-validation-rule','Validation rule "'+ruleName+'" does not exist.');

//         // run the validations and set the errors.
//         var context = {
//           value: value
//           , fieldName: key
//           , options: options
//           , values: doc
//           , validators: Forms.validators // allows overloading
//         };

//         if(!Forms.validators[ruleName](context)){
//           tmpl.errors.insert({
//             name: key
//             , error: ruleName
//             , message: schema[key].message
//           });
//         }
//       });
//     }
//   });

//   return !tmpl.errors.find().count();
// };

//   // The set of helpers available by default to any form instance, these helpers
//   // are attached to a Template via `Forms.mixin(Template.myTemplate)`, to
//   // disable this behavior pass an options object with `{helpers: false}`
// Forms.helpers = {
//   doc: function () {
//     var tmpl = Template.instance();
//     return tmpl.doc.get();
//   }
//   , value: function (name) {
//     return Forms.get(Forms.call('doc'), name);
//   }
//   , errors: function () {
//     var tmpl = Template.instance();
//     return tmpl.errors.find().fetch();
//   }
//   , error: function (name) {
//     var tmpl = Template.instance();
//     var error = tmpl.errors.findOne(Forms.selector(name));
//     return error && error.error;
//   }
//   , isValid: function (name) {
//     var error = Forms.call('error', name);
//     return !error;
//   }
//   , isInvalid: function (name) {
//     var error = Forms.call('error', name);
//     return !!error;
//   }
//   , form: function () {
//     var tmpl = Template.instance();
//     var helpers = {};
//     _.each(Forms.helpers, function (helper, name) {
//       helpers[name] = function () {
//         var args = _.toArray(arguments);
//         // var elem = tmpl.$('form')[0] || tmpl.$('div')[0];
//         // var view = Blaze.getView(elem);
//         var self = this;
//         return Blaze._withCurrentView(tmpl.view, function () {
//           return Forms.call.apply(self, [name].concat(args));
//         });
//       };
//     });
//     return helpers;
//   }
// };

//   // The set of events attached by default to any form instance, these events
//   // are attached to a Template via `Forms.mixin(Template.myTemplate)`, to
//   // disable this behavior pass an options object with `{events: false}`
// Forms.events = {
//   'change, propertyChange': function (e, tmpl) {
//     if (e.isDefaultPrevented())
//       return;

//     e.preventDefault();

//     //http://stackoverflow.com/a/24252333/2391620 default cannot be prevented for change events
//     e.stopPropagation();

//     Forms.change(e, tmpl);
//   }
//   , 'submit': function (e, tmpl) {
//     if (e.isDefaultPrevented())
//       return;

//     e.preventDefault();

//     Forms.submit(e, tmpl);
//   }
// };

//   // Extends a template to add the Forms helpers, events and initialization
//   // logic.
// Forms.mixin = function (template, options) {
//   options = _.defaults({}, options, {
//     events: true
//     , helpers: true
//     , initialize: true
//   });
  
//   if (options.initialize)
//     template.onCreated(Forms.onCreated);
  
//   if (options.helpers)
//     template.helpers(Forms.helpers);

//   if(options.events)
//     template.events(Forms.events);
// };
