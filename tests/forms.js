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
    e.preventDefault();
    test.equal(e.doc, {
      name: 'joe'
    });
    didCallHandler = true;
  });

  div.find('form').trigger('submit');
  test.equal(didCallHandler, true);
});
