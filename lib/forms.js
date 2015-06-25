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

Forms.call = function (methodName) {
  var args = _.toArray(arguments).slice(1);
  return Blaze.getView().lookup(methodName).apply(this, args);
};

Forms.get = function (doc, name) {
  check(name, String);
  var part;
  var names = name.split(/[\[\]\.]/g);
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

Forms.set = function (doc, name, value) {
  doc = doc || {};

  check(name, String);
  check(doc, Object);

  var token;
  var parts;
  var remainder = name;
  var child = doc;
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
      // run the validations and set the errors.
        var context = {
          value: value
          , fieldName: key
          , options: options
          , values: doc
          , validators: Forms.validators
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





Forms.trigger = function (type, el, data) {
  var eventToTrigger = $.Event(type);
  _.extend(eventToTrigger, data);
  $(el).trigger(eventToTrigger);
};

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

Forms.submit = function (e, tmpl) {
  // Attach the document, in case the user has some custom handlign they
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
    if (e.isDefaultPrevented())
      return;
    e.preventDefault();

    Forms.change(e, tmpl);
  }
  , 'submit form': function (e, tmpl) {
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
