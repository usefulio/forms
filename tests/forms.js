Forms.mixin(Template.simpleForm);
Forms.mixin(Template.complexForm);

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

Tinytest.add('Forms - initial data', function (test) {
  var div = makeForm(null, {doc: {name: 'joe'}}).div;

  test.equal(div.find('input').val(), 'joe');
});

Tinytest.add('Forms - reactive data', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  doc.set({
    doc: {
      name: 'sam'
    }
  });

  Tracker.flush();
  test.equal(div.find('input').val(), 'sam');
});

Tinytest.add('Forms - propertyChange event updates doc', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.find('input').val('william');
  div.find('input').trigger('propertyChange');

  Tracker.flush();
  test.equal(div.find('input').val(), 'william');
});

Tinytest.add('Forms - custom change values updates doc', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.find('input').val('william');
  Forms.trigger('propertyChange', div.find('input'), {
    propertyName: 'name'
    , propertyValue: 'bill'
  });

  Tracker.flush();
  test.equal(div.find('input').val(), 'bill');
});

Tinytest.add('Forms - documentChange event is triggered', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.on('documentChange', function (e) {
    e.preventDefault();
    test.equal(e.doc, {
      name: 'joe'
    });
    didCallHandler = true;
  });

  div.find('input').val('joe');
  div.find('input').trigger('change');

  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - documentSubmit event is triggered', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.on('documentSubmit', function (e) {
    test.equal(e.doc, {
      name: 'joe'
    });
    didCallHandler = true;
  });

  div.find('form').trigger('submit');
  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - documentSubmit event is not triggered when form is invalid', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return false;}}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.on('documentSubmit', function (e) {
    e.preventDefault();
    test.equal(e.doc, {
      name: 'joe'
    });
    didCallHandler = true;
  });

  div.find('form').trigger('submit');
  test.equal(didCallHandler, false);
});

Tinytest.add('Forms - documentInvalid event is triggered when form is invalid', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return false;}}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.on('documentInvalid', function (e) {
    e.preventDefault();
    test.equal(e.doc, {
      name: 'joe'
    });
    didCallHandler = true;
  });

  div.find('form').trigger('submit');
  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - submit event recieves errors when form is invalid', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return false;}}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.on('submit', function (e) {
    test.equal(e.doc, {
      name: 'joe'
    });
    test.equal(_.pluck(e.errors, 'name'), ['name']);
    didCallHandler = true;
  });

  div.find('form').trigger('submit');
  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - documentInvalid event recieves errors', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return false;}}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.on('documentInvalid', function (e) {
    test.equal(e.doc, {
      name: 'joe'
    });
    test.equal(_.pluck(e.errors, 'name'), ['name']);
    didCallHandler = true;
  });

  div.find('form').trigger('submit');
  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - nested data', function (test) {
  var div = makeForm(null, {doc: { profile: { name: 'joe'}, emails: ['joe@example.com']}}).div;

  Blaze._withCurrentView(Blaze.getView(div.find('input')[0]), function () {
    test.equal(Forms.call('value', 'profile.name'), 'joe');
    test.equal(Forms.call('value', 'emails[0]'), 'joe@example.com');
    var doc = {};
    Forms.set(doc, 'profile.name', 'joe');
    Forms.set(doc, 'emails[0]', 'joe@example.com');
    Forms.set(doc, 'profile.emails[0].address', 'joe@example.com');
    test.equal(doc, {
      profile: {
        name: 'joe'
        , emails: [{
          address: 'joe@example.com'
        }]
      }
      , emails: [
        'joe@example.com'
      ]
    });
    test.equal(Forms.get(doc, 'profile.name'), 'joe');
    test.equal(Forms.get(doc, 'emails[0]'), 'joe@example.com');
    test.equal(Forms.get(doc, 'profile.emails[0].address'), 'joe@example.com');
  });
});

Tinytest.add('Forms - form helper', function (test) {
  var div = makeForm('complexForm', {doc: {name: 'joe'}}).div;

  test.equal(div.find('input').val(), 'joe');
});

Tinytest.add('Forms - reactive form helper', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm('complexForm', function () {
    return doc.get();
  }).div;

  doc.set({
    doc: {
      name: 'sam'
    }
  });

  Tracker.flush();
  test.equal(div.find('input').val(), 'sam');
});

// ####################################################################
// ####################################################################
// Form event triggering tests


// ####################################################################
// ####################################################################
// Form event detection tests
Tinytest.add('Forms - Event detection - change event updates doc', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.find('input').val('william');
  div.find('input').trigger('change');

  Tracker.flush();
  test.equal(doc.get().doc.name, 'william');
});

Tinytest.add('Forms - Event detection - submit event is triggered', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.on('submit', function (e) {
    e.preventDefault();
    test.equal(e.doc, {
      name: 'joe'
    });
    didCallHandler = true;
  });

  div.find('form').trigger('submit');
  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - Event detection - submit method is called', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var template = makeTemplate('simpleForm');
  Forms.mixin(template);
  template.events({
    'mockSubmit': function (e, tmpl) {
      Forms.submit( e, tmpl );
    }
  });
  var div = makeForm(template, function () {
    return doc.get();
  }).div;

  div.on('documentSubmit', function (e) {
    test.equal(e.doc, {
      name: 'joe'
    });
    didCallHandler = true;
  });

  div.find('input').trigger('mockSubmit');

  test.equal(didCallHandler, true);
});

// ####################################################################
// ####################################################################
// Form validation tests

Tinytest.add('Forms - Validation - custom validators - reactive error message displayed', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return false;}}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.find('form').trigger('submit');

  Tracker.flush();
  test.equal(div.find('.error').text(), 'invalid');
});

Tinytest.add('Forms - Validation - custom validators - custom error message displayed', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return 'not valid';}}});
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  div.find('form').trigger('submit');

  Tracker.flush();
  test.equal(div.find('.error').text(), 'not valid');
});

Tinytest.add('Forms - Validation - built-in validators - "unknown validation rule" error is thrown', function (test) {
  var errorThrown = false;

  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {'name': {'INVALIDTYPE': 'some options'}} });
  var div = makeForm(null, function () {
    return doc.get();
  }).div;

  try {
      div.find('form').trigger('submit');
  } catch (err) {
    if (err && err.error === "unknown-validation-rule")
      errorThrown = true;
  }

  Tracker.flush();

  test.isTrue(errorThrown, "unknown rule detecion failed");
});
