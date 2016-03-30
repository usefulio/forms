Forms.mixin(Template.simpleForm);
Forms.mixin(Template.complexForm);

Template.simpleForm.helpers({
  value: function () { }
});

// Utils
function makeTemplate(formName) {
  return new Template(Template[formName].renderFunction);
}
function makeForm(template, data, options) {
  options = options || {};
  data = data || {};
  template = template || "simpleForm";

  if (_.isString(template))
    template = Template[template];

  var div = $('<div>');
  var view = Blaze.renderWithData(template, data, div[0]);
  return {
    div: div,
    templateInstance: view._domrange.members[0].view.templateInstance(), // https://github.com/meteor/meteor/issues/2573#issuecomment-101099328
    template: template,
    view: view
    };
}
function checkEntities(test, entities, expected) {
  test.equal(_.map(entities, function (entity) {
    return _.omit(entity, '_id');
  }), expected);
}

Tinytest.add('Forms - Forms.mixin() - respects options.events === false', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template, {
    events: false
  });
  test.equal(template.__eventMaps.length, 0);
});

Tinytest.add('Forms - Forms.mixin() - respects options.helpers === false', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template, {
    helpers: false
  });
  test.equal(_.keys(template.__helpers).length, 0);
});

Tinytest.add('Forms - Forms.mixin() - sets default doc', function (test) {
  var template = makeTemplate('simpleForm');
  template.helpers({
    value: function () { }
  });
  Forms.mixin(template, {
    doc: {
      isDefault: true
    }
  });
  var ownDoc = new ReactiveVar(false);
  var tmpl = makeForm(template, function () {
    return ownDoc.get() ? {doc: { ownDoc: true } } : {};
  }).templateInstance;
  test.equal(tmpl.form.doc(), { isDefault: true });
  ownDoc.set(true);
  Tracker.flush();
  test.equal(tmpl.form.doc(), { ownDoc: true });
  ownDoc.set(false);
  Tracker.flush();
  tmpl.form.doc('myField', 'myValue');
  test.equal(tmpl.form.doc(), { isDefault: true, myField: 'myValue' });
});

Tinytest.add('Forms - Forms.mixin() - sets default schema', function (test) {
  var template = makeTemplate('simpleForm');
  template.helpers({
    value: function () { }
  });
  Forms.mixin(template, {
    schema: {
      isDefault: true
    }
  });
  var ownDoc = new ReactiveVar(false);
  var tmpl = makeForm(template, function () {
    return ownDoc.get() ? {schema: { ownDoc: true } } : {};
  }).templateInstance;
  test.equal(tmpl.form.schema(), { isDefault: true });
  ownDoc.set(true);
  Tracker.flush();
  test.equal(tmpl.form.schema(), { ownDoc: true });
  ownDoc.set(false);
  Tracker.flush();
  tmpl.form.schema('myField', 'myValue');
  test.equal(tmpl.form.schema(), { isDefault: true, myField: 'myValue' });
});

Tinytest.add('Forms - Forms.instance() - is accessible in helpers and events and on Template.instance()', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      var tmpl = Template.instance();
      test.isTrue(_.isObject(Forms.instance()));
      test.isTrue(_.isObject(tmpl.form));
      test.equal(Forms.instance(), tmpl.form);
      didFire++;
    }
    , error: function () {}
  });
  template.events({
    'customEvent': function (e, tmpl) {
      test.isTrue(_.isObject(Forms.instance()));
      test.isTrue(_.isObject(tmpl.form));
      test.equal(Forms.instance(), tmpl.form);
      didFire++;
    }
  });
  var dom = makeForm(template);
  dom.div.find('input').trigger('customEvent');
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance() - returns null when called outside of template context', function (test) {
  test.isNull(Forms.instance());
});

Tinytest.add('Forms - Forms.instance().original - returns a reactive clone of this.doc', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      var form = Forms.instance();
      var original = form.original();
      test.equal(original, {
        iteration: didFire
      });

      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, function () {
    dep.depend();
    return {
      doc: {
        iteration: didFire
      }
    };
  });
  dep.changed();
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().original - can be manually set', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var original = form.original();
      test.equal(original, {
        iteration: didFire
      });

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: didFire
      }
    };
  });
  form.original({ iteration: didFire });
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().doc - returns a reactive clone of this.doc', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      var form = Forms.instance();
      var doc = form.doc();

      test.equal(doc, {
        iteration: didFire
      });

      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, function () {
    dep.depend();
    return {
      doc: {
        iteration: didFire
      }
    };
  });
  dep.changed();
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().doc - is accessible as a template helper', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var docHelper = Blaze.getView().lookup('doc');
      test.equal(docHelper.call(this), didFire ? { test: didFire } : {});
      test.equal(docHelper.call(this, 'test'), didFire || undefined);
      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, {
    doc: {}
  });
  form.doc('test', didFire);
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().doc - sets the document', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();
      var doc = formInstance.doc();

      test.equal(doc, {
        iteration: didFire
      });

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });
  formInstance.doc({iteration: 1});
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().doc - gets and sets a reactive document property', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();

      test.equal(formInstance.doc('iteration'), didFire);

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });
  formInstance.doc('iteration', 1);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().doc - gets and sets a reactive sub-document property', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();

      test.equal(formInstance.doc('value.iteration'), didFire);

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        value: {
          iteration: 0
        }
      }
    };
  });
  formInstance.doc('value.iteration', 1);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().doc - throws on invalid arguments', function (test) {
  var template = makeTemplate('simpleForm');
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });

  test.throws(function () {
    formInstance.doc({}, {});
  });

  test.throws(function () {
    formInstance.doc('name', {}, {});
  });

  test.throws(function () {
    formInstance.doc(null);
  });

  test.throws(function () {
    formInstance.doc(undefined);
  });

  test.throws(function () {
    formInstance.doc('');
  });
});

Tinytest.add('Forms - Forms.instance().doc - getters & setters can be overridden', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  Forms._utils._doc = {
    get: function () {
      return '1';
    }
    , set: function (doc, propertyName, value) {
      didFire++;
      doc[propertyName] = value;
    }
  };
  template.helpers({
    value: function () {
      formInstance = Forms.instance();

      test.equal(formInstance.doc('iteration'), '1');

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });
  formInstance.doc('iteration', 1);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 3);
  test.equal(formInstance.doc(), {
    iteration: 1
  });
  delete Forms._utils._doc;
});

Tinytest.add('Forms - Forms.instance().schema - returns a reactive clone of this.schema', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      var form = Forms.instance();
      var schema = form.schema();

      test.equal(schema, {
        iteration: didFire
      });

      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, function () {
    dep.depend();
    return {
      schema: {
        iteration: didFire
      }
    };
  });
  dep.changed();
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().schema - is accessible as a template helper', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var schemaHelper = Blaze.getView().lookup('schema');
      test.equal(schemaHelper.call(this), didFire ? { test: didFire } : {});
      test.equal(schemaHelper.call(this, 'test'), didFire || undefined);
      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, {
    schema: {}
  });
  form.schema('test', didFire);
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().schema - sets the schema', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();
      var schema = formInstance.schema();

      test.equal(schema, {
        iteration: didFire
      });

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      schema: {
        iteration: 0
      }
    };
  });
  formInstance.schema({iteration: 1});
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().schema - gets and sets a reactive schema property', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();

      test.equal(formInstance.schema('iteration'), didFire);

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      schema: {
        iteration: 0
      }
    };
  });
  formInstance.schema('iteration', 1);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().schema - throws on invalid arguments', function (test) {
  var template = makeTemplate('simpleForm');
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      schema: {
        iteration: 0
      }
    };
  });

  test.throws(function () {
    formInstance.schema({}, {});
  });

  test.throws(function () {
    formInstance.schema('name', {}, {});
  });

  test.throws(function () {
    formInstance.schema(null);
  });

  test.throws(function () {
    formInstance.schema(undefined);
  });

  test.throws(function () {
    formInstance.schema('');
  });

  test.throws(function () {
    formInstance.schema(null);
  });
});

Tinytest.add('Forms - Forms.instance().get - is an alias for doc get', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();

      test.equal(formInstance.get(), {iteration: didFire});
      test.equal(formInstance.get('iteration'), didFire);

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });
  formInstance.doc('iteration', 1);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(formInstance.get('iteration'), 1);
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().get - throws on invalid arguments', function (test) {
  var template = makeTemplate('simpleForm');
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });

  test.throws(function () {
    formInstance.get({}, {});
  });

  test.throws(function () {
    formInstance.get(null);
  });

  test.throws(function () {
    formInstance.get(undefined);
  });

  test.throws(function () {
    formInstance.get('');
  });

  test.throws(function () {
    formInstance.get(null);
  });
});

Tinytest.add('Forms - Forms.instance().set - is an alias for doc set', function (test) {
  var template = makeTemplate('simpleForm');
  var didFire = 0;
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();

      test.equal(formInstance.doc('iteration'), didFire);

      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });
  formInstance.set('iteration', 1);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  formInstance.set({'iteration': 2});
  Tracker.flush();
  test.equal(didFire, 3);
});

Tinytest.add('Forms - Forms.instance().set - throws on invalid arguments', function (test) {
  var template = makeTemplate('simpleForm');
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });

  test.throws(function () {
    formInstance.set({}, {});
  });

  test.throws(function () {
    formInstance.set('field');
  });

  test.throws(function () {
    formInstance.set(null);
  });

  test.throws(function () {
    formInstance.set(undefined);
  });

  test.throws(function () {
    formInstance.set('');
  });
});

Tinytest.add('Forms - Forms.instance().errors - get and set reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var errors = [];
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      checkEntities(test, form.errors(), errors);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  errors = [{message: 'x'}];
  form.errors(errors);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().errors - get and set property errors reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var errors = [];
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      checkEntities(test, form.errors('someName'), errors);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  // This is our input
  errors = [{message: 'x'}];
  form.errors('someName', errors);
  form.errors('otherName', errors);
  // This is what we expect to get back
  errors = [{message: 'x', name: 'someName'}];
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().errors - is accessible as a template helper', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var errors = [];
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var errorsHelper = Blaze.getView().lookup('errors');
      checkEntities(test, errorsHelper.call(this), errors);
      checkEntities(test, errorsHelper.call(this, 'test'), errors);
      didFire++;
    }
    , error: function () {}
  });
  var dom = makeForm(template);
  form.errors('test', {iterations: didFire});
  errors = [{ name: 'test', iterations: didFire }];
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().errors - throws on invalid arguments', function (test) {
  var template = makeTemplate('simpleForm');
  var formInstance;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      formInstance = Forms.instance();
    }
    , error: function () {}
  });
  var dom = makeForm(template, function () {
    return {
      doc: {
        iteration: 0
      }
    };
  });

  test.throws(function () {
    formInstance.errors({}, {});
  });

  test.throws(function () {
    formInstance.errors([], []);
  });

  test.throws(function () {
    formInstance.errors('field', '');
  });

  test.throws(function () {
    formInstance.errors('field', null);
  });

  test.throws(function () {
    formInstance.errors('field', undefined);
  });

  test.throws(function () {
    formInstance.errors(null);
  });

  test.throws(function () {
    formInstance.errors(undefined);
  });

  test.throws(function () {
    formInstance.errors('');
  });
});

Tinytest.add('Forms - Forms.instance().error - gets first error reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var errors = [];
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var results = form.error();
      if (!errors.length)
        test.isUndefined(results);
      else
        checkEntities(test, [results], errors);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  // This is our input
  errors = [{message: 'x'}];
  form.errors('someName', errors.concat(errors));
  // This is what we expect to get back
  errors = [{message: 'x', name: 'someName'}];
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().error - gets first property error reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var errors = [];
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var results = form.error('someName');
      if (!errors.length)
        test.isUndefined(results);
      else
        checkEntities(test, [results], errors);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  // This is our input
  errors = [{message: 'x'}];
  form.errors('someName', errors);
  form.errors('otherName', errors);
  // This is what we expect to get back
  errors = [{message: 'x', name: 'someName'}];
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().error - is accessible as a template helper', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var errors = [];
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var errorHelper = Blaze.getView().lookup('error');
      var results = errorHelper('someName');
      var otherResults = errorHelper();
      if (!errors.length) {
        test.isUndefined(results);
        test.isUndefined(otherResults);
      }
      else {
        checkEntities(test, [results], errors);
        checkEntities(test, [otherResults], errors);
      }
      didFire++;
    }
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  // This is our input
  errors = [{message: 'x'}];
  form.errors('someName', errors);
  // This is what we expect to get back
  errors = [{message: 'x', name: 'someName'}];
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  test.equal(didFire, 2);
});

Tinytest.add('Forms - Forms.instance().isValid - gets validity reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var isValid = true;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      test.equal(form.isValid(), isValid);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  isValid = false;
  form.errors('someName', [{message: 'x'}]);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  isValid = true;
  form.errors('someName', []);
  Tracker.flush();
  test.equal(didFire, 3);
});

Tinytest.add('Forms - Forms.instance().isValid - gets property validity reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var isValid = true;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      test.equal(form.isValid('someName'), isValid);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  isValid = false;
  form.errors('someName', [{message: 'x'}]);
  form.errors('otherName', [{message: 'x'}]);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  isValid = true;
  form.errors('someName', []);
  Tracker.flush();
  test.equal(didFire, 3);
});

Tinytest.add('Forms - Forms.instance().isValid - is accessible as a template helper', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var propertyIsValid = true;
  var formIsValid = true;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var isValidHelper = Blaze.getView().lookup('isValid');
      test.equal(isValidHelper(), formIsValid);
      test.equal(isValidHelper('someName'), propertyIsValid);
      didFire++;
    }
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  formIsValid = false;
  propertyIsValid = false;
  form.errors('someName', [{message: 'x'}]);
  form.errors('otherName', [{message: 'x'}]);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  propertyIsValid = true;
  form.errors('someName', []);
  Tracker.flush();
  test.equal(didFire, 3);
});

Tinytest.add('Forms - Forms.instance().isInvalid - gets validity reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var isValid = true;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      test.equal(form.isInvalid(), !isValid);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  isValid = false;
  form.errors('someName', [{message: 'x'}]);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  isValid = true;
  form.errors('someName', []);
  Tracker.flush();
  test.equal(didFire, 3);
});

Tinytest.add('Forms - Forms.instance().isInvalid - gets property validity reactively', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var isValid = true;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      test.equal(form.isInvalid('someName'), !isValid);
      didFire++;
    }
    , error: function () {}
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  isValid = false;
  form.errors('someName', [{message: 'x'}]);
  form.errors('otherName', [{message: 'x'}]);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  isValid = true;
  form.errors('someName', []);
  Tracker.flush();
  test.equal(didFire, 3);
});

Tinytest.add('Forms - Forms.instance().isInvalid - is accessible as a template helper', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  var didFire = 0;
  var propertyIsValid = true;
  var formIsValid = true;
  Forms.mixin(template);
  template.helpers({
    value: function () {
      form = Forms.instance();
      var isInvalidHelper = Blaze.getView().lookup('isInvalid');
      test.equal(isInvalidHelper(), !formIsValid);
      test.equal(isInvalidHelper('someName'), !propertyIsValid);
      didFire++;
    }
  });
  var dep = new Tracker.Dependency();
  var dom = makeForm(template, {});
  formIsValid = false;
  propertyIsValid = false;
  form.errors('someName', [{message: 'x'}]);
  form.errors('otherName', [{message: 'x'}]);
  // Tracker.flush() is necessary because dep.changed does not trigger an 
  // immediate rerun of computations, this ensures that our helper above
  // runs the second time synchronously
  Tracker.flush();
  propertyIsValid = true;
  form.errors('someName', []);
  Tracker.flush();
  test.equal(didFire, 3);
});

Tinytest.add('Forms - Forms.instance().change - updates the doc and triggers documentChange', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      form.change({
        myField: 'myValue'
      }, e.currentTarget);
    }
    , 'documentChange': function (e, tmpl, doc, changes) {
      test.equal(doc, {
        myField: 'myValue'
        , otherField: 'otherValue'
      });
      test.equal(changes, {
        myField: 'myValue'
      });
      didFire = true;
    }
  });
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
  }).div;
  var didFire = false;
  div.find('input').trigger('customEvent');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.instance().change - accepts key and value arguments', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      form.change('myField', 'myValue', e.currentTarget);
    }
    , 'documentChange': function (e, tmpl, doc, changes) {
      test.equal(doc, {
        myField: 'myValue'
        , otherField: 'otherValue'
      });
      test.equal(changes, {
        myField: 'myValue'
      });
      didFire = true;
    }
  });
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
  }).div;
  var didFire = false;
  div.find('input').trigger('customEvent');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.instance().change - calls prevent default', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      form.change({
        myField: 'myValue'
      }, e.currentTarget, e);
      test.isTrue(e.isDefaultPrevented());
    }
    , 'documentChange': function (e, tmpl, doc, changes) {
      test.equal(doc, {
        myField: 'myValue'
        , otherField: 'otherValue'
      });
      test.equal(changes, {
        myField: 'myValue'
      });
      didFire = true;
    }
  });
  var didFire = false;
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
  }).div;
  div.find('input').trigger('customEvent');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.instance().change - respects prevent default', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      e.preventDefault();
      form.change({
        myField: 'myValue'
      }, e.currentTarget, e);
    }
    , 'documentChange': function (e, tmpl, doc, changes) {
      test.equal(doc, {
        myField: 'myValue'
        , otherField: 'otherValue'
      });
      test.equal(changes, {
        myField: 'myValue'
      });
      didFire = true;
    }
  });
  var didFire = false;
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
  }).div;
  div.find('input').trigger('customEvent');
  test.equal(didFire, false);
});

Tinytest.add('Forms - Forms.instance().change - does not trigger if missing eventTarget', function (test) {
  var template = makeTemplate('simpleForm');
  var form;
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      form = Forms.instance();
      form.change({
        myField: 'myValue'
      }, e);
    }
    , 'documentChange': function (e, tmpl, doc, changes) {
      test.equal(doc, {
        myField: 'myValue'
        , otherField: 'otherValue'
      });
      test.equal(changes, {
        myField: 'myValue'
      });
      didFire = true;
    }
  });
  var didFire = false;
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
  }).div;
  div.find('input').trigger('customEvent');
  test.equal(didFire, false);
  test.equal(form.doc('myField'), 'myValue');
});

Tinytest.add('Forms - Forms.instance().invalidate - inserts errors and triggers documentInvalid', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      form.invalidate([{
        message: 'invalid'
      }], e.currentTarget);
    }
    , 'documentInvalid': function (e, tmpl, doc, errors) {
      test.equal(doc, {
        otherField: 'otherValue'
      });
      checkEntities(test, errors, [{message: 'invalid'}]);
      didFire = true;
    }
  });
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
  }).div;
  var didFire = false;
  div.find('input').trigger('customEvent');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.instance().invalidate - inserts property errors and triggers propertyInvalid', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      form.errors([{message: 'x'}]);
      form.invalidate('myField', [{
        message: 'invalid'
      }], e.currentTarget);
    }
    , 'propertyInvalid': function (e, tmpl, doc, errors) {
      test.equal(doc, {
        otherField: 'otherValue'
      });
      checkEntities(test, errors, [{name: 'myField', message: 'invalid'}]);
      didFire = true;
    }
  });
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
  }).div;
  var didFire = false;
  div.find('input').trigger('customEvent');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.instance().validate - runs schema validation and triggers documentInvalid', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      var errors = form.validate(e.currentTarget);
      checkEntities(test, errors, [{name: 'otherField', message: 'invalid'}]);
    }
    , 'documentInvalid': function (e, tmpl, doc, errors) {
      test.equal(doc, {
        otherField: 'otherValue'
      });
      checkEntities(test, errors, [{name: 'otherField', message: 'invalid'}]);
      didFire = true;
    }
  });
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
    , schema: {
      otherField: function () {
        return 'invalid';
      }
    }
  }).div;
  var didFire = false;
  div.find('input').trigger('customEvent');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.instance().submit - validates document and triggers documentSubmit', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'customEvent': function (e, tmpl) {
      var form = Forms.instance();
      form.submit(e.currentTarget);
    }
    , 'documentInvalid': function (e, tmpl, doc, errors) {
      test.equal(doc, {
        otherField: 'otherValue'
      });
      checkEntities(test, errors, [{name: 'otherField', message: 'invalid'}]);
      invalidDidFire = true;
    }
    , 'documentSubmit': function (e, tmpl, doc) {
      test.equal(doc, {
        otherField: 'otherValue'
      });
      submitDidfire = true;
    }
  });
  var isValid;
  var div = makeForm(template, {
    doc: {
      otherField: 'otherValue'
    }
    , schema: {
      otherField: function () {
        return isValid ? true : 'invalid';
      }
    }
  }).div;
  var invalidDidFire = false;
  var submitDidfire = false;
  div.find('input').trigger('customEvent');
  test.equal(invalidDidFire, true);
  isValid = true;
  div.find('input').trigger('customEvent');
  test.equal(submitDidfire, true);
});

Tinytest.add('Forms - Forms.events.change - triggers propertyChange event', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'propertyChange': function (e, tmpl, changes) {
      test.equal(changes, {name: 'myname'});
      didFire = true;
    }
  });
  var div = makeForm(template).div;
  var didFire = false;

  div.find('input').val('myname');
  div.find('input').trigger('change');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.events.change - works with nested forms', function (test) {
  var template = makeTemplate('nestedForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'change': function (e, tmpl, doc) {
      didFire = true;
    }
    , 'documentChange': function (e, tmpl) {
      test.equal(tmpl.form.doc(), {});
    }
  });
  var div = makeForm(template).div;
  var didFire = false;

  div.find('input').val('myname');
  div.find('input').trigger('change');
  test.equal(didFire, false);
});

Tinytest.add('Forms - Forms.events.propertyChange - updates the doc and triggers documentChange', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'documentChange': function (e, tmpl, doc) {
      test.equal(doc, {name: 'myname'});
      didFire = true;
    }
  });
  var div = makeForm(template).div;
  var didFire = false;

  div.find('input').trigger('propertyChange', {
    name: 'myname'
  });
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.events.propertyChange - respects default prevented', function (test) {
  var template = makeTemplate('simpleForm');
  template.helpers({ value: function () { } });
  template.events({
    'propertyChange': function (e, tmpl) {
      e.preventDefault();
    }
    , 'documentChange': function (e, tmpl, doc) {
      didFire = true;
    }
  });
  Forms.mixin(template);
  var div = makeForm(template).div;
  var didFire = false;

  div.find('input').trigger('propertyChange', {
    name: 'myname'
  });
  test.equal(didFire, false);
});

Tinytest.add('Forms - Forms.events.propertyChange - works with nested forms', function (test) {
  var template = makeTemplate('nestedForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'documentChange': function (e, tmpl, doc) {
      // This event should be triggered by the inner form, which should be the
      // only form which was affected by the propertyChange event we triggered
      // below.

      var form = Forms.instance();
      var ownDoc = form.doc();
      test.equal(doc, {
        name: 'myname'
      });
      test.equal(ownDoc, {});
      didFire = true;
    }
  });
  var div = makeForm(template).div;
  var didFire = false;

  div.find('input').trigger('propertyChange', {
    name: 'myname'
  });
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.events.submit - validates the doc and triggers documentSubmit', function (test) {
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.helpers({ value: function () { } });
  template.events({
    'documentSubmit': function (e, tmpl, doc) {
      test.equal(doc, {name: 'myname'});
      didFire = true;
    }
  });
  var div = makeForm(template, { doc: { name: 'myname' } }).div;
  var didFire = false;

  div.find('form').trigger('submit');
  test.equal(didFire, true);
});

Tinytest.add('Forms - Forms.events.submit - respects default prevented', function (test) {
  var template = makeTemplate('simpleForm');
  template.helpers({ value: function () { } });
  template.events({
    'submit': function (e, tmpl) {
      e.preventDefault();
    }
    , 'documentSubmit': function (e, tmpl, doc) {
      test.equal(doc, {name: 'myname'});
      didFire = true;
    }
  });
  Forms.mixin(template);
  var div = makeForm(template, { doc: { name: 'myname' } }).div;
  var didFire = false;

  div.find('form').trigger('submit');
  test.equal(didFire, false);
});

Tinytest.add('Forms - template tests - simple form', function (test) {
  var template = makeTemplate('simpleForm');
  template.helpers({ value: function (fieldName) {
    if (_.isString(fieldName))
      return Forms.instance().doc(fieldName);
  }});
  template.events({
    'documentChange': function (e, tmpl, doc) {
      test.equal(doc, expected);
      didChange = true;
    }
    , 'documentSubmit': function (e, tmpl, doc) {
      test.equal(doc, expected);
      didSubmit = true;
    }
  });
  Forms.mixin(template);
  var div = makeForm(template, { doc: { name: 'myname' } }).div;
  var expected = { name: 'myname' };
  
  var didChange = false;
  var didSubmit = false;
  div.find('input').trigger('change');
  test.equal(didChange, true);

  expected.name = 'othername';
  didChange = false;
  div.find('input').val('othername');
  div.find('input').trigger('change');
  test.equal(didChange, true);

  div.find('form').trigger('submit');
  test.equal(didSubmit, true);
});

Tinytest.add('Forms - template tests - complex form', function (test) {
  var template = makeTemplate('complexForm');
  template.helpers({ value: function (fieldName) {
    if (_.isString(fieldName))
      return Forms.instance().doc(fieldName);
  }});
  template.events({
    'documentChange': function (e, tmpl, doc) {
      test.equal(doc, expected);
      didChange = true;
    }
    , 'documentSubmit': function (e, tmpl, doc) {
      test.equal(doc, expected);
      didSubmit = true;
    }
  });
  Forms.mixin(template);
  var div = makeForm(template, { doc: { name: 'myname' } }).div;
  var expected = { name: 'myname' };
  
  var didChange = false;
  var didSubmit = false;
  div.find('input').trigger('change');
  test.equal(didChange, true);

  expected.name = 'othername';
  didChange = false;
  div.find('input').val('othername');
  div.find('input').trigger('change');
  test.equal(didChange, true);

  div.find('form').trigger('submit');
  test.equal(didSubmit, true);
});

