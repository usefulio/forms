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

  
  

