Forms = {
  _onMixin: []
  , _onCreated: []
  , _helpers: {}
  , _methods: {}
  , _events: {}
  , _defaults: {}
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

function makeHelpers(helpers) {
  var result = {};
  _.each(helpers, function (helper, key) {
    result[key] = function () {
      var form = Forms.instance();
      return helper.apply(form, arguments);
    };
  });
  return result;
}

// At the moment makeEventHandlers and makeHelpers have the same functionality
// this might change in the future, so for now makeEventHandlers is an alias
var makeEventHandlers = makeHelpers;

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
  options = _.defaults(options || {}, self._defaults);
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
  var tmpl = Template.instance();
  return tmpl && tmpl.form || null;
};

Forms.helpers = function (helpers) {
  _.extend(this._helpers, helpers);
};

Forms.methods = function (methods) {
  _.extend(this._methods, methods);
};

Forms.events = function (events) {
  _.extend(this._events, events);
};

Forms.defaults = function (defaults) {
  _.extend(this._defaults, defaults);
};

// Initialize Forms behavior
// ================

Forms.onMixin(function (template, options) {
  var self = this;
  _.each(self._onCreated, function (callback) {
    template.onCreated(function () {
      callback.call(this, options);
    });
  });
  if (options.helpers)
    template.helpers(makeHelpers(self._helpers));
  if (options.events)
    template.events(makeEventHandlers(self._events));
});

Forms.onCreated(function (options) {
  var tmpl = this;
  tmpl.form = {};

  _.extend(tmpl.form, Forms._helpers);
  _.extend(tmpl.form, Forms._methods);

  tmpl.autorun(function () {
    var data = Template.currentData();
    tmpl.form.doc(data && data.doc ? _.clone(data.doc) : options.doc || {});
    tmpl.form.schema(data && data.schema ? _.clone(data.schema) : options.schema || {});
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
  , form: function () {
    var form = this;
    var helpers = {};
    _.each(Forms._helpers, function (helper, key) {
      helpers[key] = function () {
        return helper.apply(form, arguments);
      };
    });
    return helpers;
  }
});

Forms.events({
  'change input': function (e, tmpl) {
    var propertyName = e.currentTarget.name;
    if (propertyName && propertyName.length) {
      // XXX less invasive method of preventing this event from being handled
      // by multiple forms instances?
      e.stopPropagation();
      e.stopImmediatePropagation();
      var changes = {};
      changes[propertyName] = e.currentTarget.value;
      $(e.currentTarget).trigger('propertyChange', changes);
    }
  }
  , 'propertyChange': function (e, tmpl, changes) {
    this.change(changes, e.currentTarget, e);
  }
  , 'submit': function (e, tmpl) {
    this.submit(e.currentTarget, e);
  }
});

Forms.defaults({
  helpers: true
  , events: true
});
