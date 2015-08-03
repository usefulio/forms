Forms = {};

  // Initializes a form instance. This method attached to a Template class as
  // part of `Forms.mixin(Template.myTemplate)`
Forms.onCreated = function () {
  var tmpl = this;
  tmpl.doc = new ReactiveVar();
  tmpl.errors = new Mongo.Collection(null);

  tmpl.autorun(function () {
    var data = Template.currentData();
    tmpl.doc.set(data && data.doc);
  });
};

  // Looks up a name in the current view, so that the forms package has access
  // to variables as they would exist in a template tag
  // https://github.com/meteor/meteor/blob/devel/packages/blaze/lookup.js#L123
Forms.call = function (methodName) {
  check(methodName, String);

  var args = _.toArray(arguments).slice(1);
  return Blaze.getView().lookup(methodName).apply(this, args);
};

  // Gets a property of an object by name where name can be a deeply nested
  // property lookup such as `profile.photos[0].url`
Forms.get = function (doc, name) {
  // XXX check(doc, Match.oneOf(Object, undefined));
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

  // Sets a property of an object by name where name can be a deeply nested
  // property lookup such as `profile.photos[0].url`. Will create objects or
  // arrays in the lookup path if they do not exist.
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

  // The default handler for change events.
  // Parses a change event and updates the form doc instance accordingly.
  // Will get the property name and value from e.currentTarget or 
  // e.propertyName, e.propertyValue if they exist.
  // Will trigger documentChange event if the document is updated
Forms.change = function (e, tmpl, changes) {
  var propertyName = e.currentTarget.name;
  var propertyValue = e.currentTarget.value;

  if (!_.isUndefined(changes)) {
    changes.propertyName && (propertyName = changes.propertyName);
    changes.propertyValue && (propertyValue = changes.propertyValue);
  }

  if (propertyName) {
    var doc = tmpl.doc.get();
    doc = Forms.set(doc, propertyName, propertyValue);
    // This works because ReactiveVar will trigger dep.changed() if oldDoc is same object instance as newDoc
    tmpl.doc.set(doc);
    $(e.currentTarget).trigger('documentChange', doc);
  }
};

  // The default handler for submit events.
  // Validates a form and triggers either documentSubmit or documentInvalid.
  // Also attaches the doc property to the submit event for convenience.
Forms.submit = function (e, tmpl) {
  // Attach the document, in case the user has some custom handling they
  // want to happen regardless of form validation.

  var doc = tmpl.doc.get();

  var isValid = Forms.validate(doc, Forms.call('schema'));

  if (isValid)
    $(e.currentTarget).trigger('documentSubmit', doc);
  else {
    var errors = Forms.call('errors');
    $(e.currentTarget).trigger('documentInvalid', [ doc, errors ])
  }
};

  // Takes a property name argument and returns a selector which can be used to
  // find related errors in the form errors collection
Forms.selector = function (name) {
  // XXX support finding sub-document errors, e.g.
  // if an error for 'profile.name' exists, we might want to return
  // that errror when searching for 'profile' errors.
  return {
    name: name
  };
};

  // Validates doc against schema and inserts any found errors into the errors
  // collection.
  // doc can be any object
  // schema should be an object who's properties are either:
  // 1. a function, which takes the property value and returns false or throws
  //    an error if the property is invalid
  // 2. an object which defines one or more built in validators
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
        // Check if validation rule in 'ruleName' is a valid built-in validator
        // name in practice an error would be thrown in the if statement below,
        // however we should throw a more informative error message.
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

  // The set of helpers available by default to any form instance, these helpers
  // are attached to a Template via `Forms.mixin(Template.myTemplate)`, to
  // disable this behavior pass an options object with `{helpers: false}`
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

  // The set of events attached by default to any form instance, these events
  // are attached to a Template via `Forms.mixin(Template.myTemplate)`, to
  // disable this behavior pass an options object with `{events: false}`
Forms.events = {
  'change, propertyChange': function (e, tmpl, changes) {
    if (e.isDefaultPrevented())
      return;

    e.preventDefault();

    //http://stackoverflow.com/a/24252333/2391620 default cannot be prevented for change events
    e.stopPropagation();

    Forms.change(e, tmpl, changes);
  }
  , 'submit': function (e, tmpl) {
    if (e.isDefaultPrevented())
      return;

    e.preventDefault();

    Forms.submit(e, tmpl);
  }
};

  // Extends a template to add the Forms helpers, events and initialization
  // logic.
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
