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
  return Blaze.getView().lookup(methodName)(args);
};

Forms.get = function (doc, name) {
  return doc && doc[name];
};

Forms.set = function (doc, name, value) {
  doc = doc || {};
  doc[name] = value;
  return doc;
};

Forms.selector = function (name) {
  return {
    name: name
  };
};

Forms.validate = function (doc, schema) {
  if (!schema)
    return true;
  else
    return false;
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
    return tmpl.errors.find();
  }
  , error: function (name) {
    var tmpl = Template.instance();
    var error = tmpl.errors.findOne(Forms.selector(name));
    return error;
  }
  , isValid: function (name) {
    var error = Forms.call('error', 'name');
    return !error;
  }
  , isInvalid: function (name) {
    var error = Forms.call('error', 'name');
    return !!error;
  }
};

Forms.events = {
  'change, propertyChange': function (e, tmpl) {
    if (e.isDefaultPrevented())
      return;
    e.preventDefault();

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


    // XXX trigger documentChange event
  }
  , 'submit': function (e, tmpl) {
    var doc = tmpl.doc.get();
    e.doc = doc;

    // XXX validate document
    // XXX trigger documentSubmit event
    // XXX trigger documentInvalid event
  }
};

Forms.mixin = function (template) {
  template.onCreated(Forms.onCreated);
  template.helpers(Forms.helpers);
  template.events(Forms.events);
};
