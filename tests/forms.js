// Setup
Forms.mixin(Template.simpleForm);

// Utils
function makeForm(formName, options) {
  var div = $('<div>');
  formName = formName || "simpleForm";
  options = options || {};
  Blaze.renderWithData(Template[formName], options, div[0]);
  return div;
}

Tinytest.add('Forms - initial data', function (test) {
  var div = makeForm(null, {doc: {name: 'joe'}});

  test.equal(div.find('input').val(), 'joe');
});

Tinytest.add('Forms - reactive data', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  });

  doc.set({
    doc: {
      name: 'sam'
    }
  });

  Tracker.flush();
  test.equal(div.find('input').val(), 'sam');
});

Tinytest.add('Forms - reactive errors', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return false;}}});
  var div = makeForm(null, function () {
    return doc.get();
  });

  div.find('form').trigger('submit');

  Tracker.flush();
  test.equal(div.find('.error').text(), 'invalid');
});

Tinytest.add('Forms - custom error message', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}, schema: {name: function () {return 'not valid';}}});
  var div = makeForm(null, function () {
    return doc.get();
  });

  div.find('form').trigger('submit');

  Tracker.flush();
  test.equal(div.find('.error').text(), 'not valid');
});

Tinytest.add('Forms - change event updates doc', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  });

  div.find('input').val('william');
  div.find('input').trigger('change');

  Tracker.flush();
  test.equal(div.find('input').val(), 'william');
});

Tinytest.add('Forms - propertyChange event updates doc', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  });

  div.find('input').val('william');
  div.find('input').trigger('propertyChange');

  Tracker.flush();
  test.equal(div.find('input').val(), 'william');
});

Tinytest.add('Forms - custom change values updates doc', function (test) {
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  });

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
  });

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

Tinytest.add('Forms - submit event is triggered', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  });

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

Tinytest.add('Forms - documentSubmit event is triggered', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var div = makeForm(null, function () {
    return doc.get();
  });

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
  });

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
  });

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
  });

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
  });

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
