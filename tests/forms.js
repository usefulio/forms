// Setup
Forms.mixin(Template.simpleForm);
Forms.mixin(Template.complexForm);
Forms.mixin(Template.nestedForms);

// Utils
function makeForm(formName, options) {
  var div = $('<div>');
  formName = formName || "simpleForm";
  options = options || {};
  var view = Blaze.renderWithData(Template[formName], options, div[0]);
  return {
    div: div,
    templateInstance: view._domrange.members[0].view.templateInstance() // https://github.com/meteor/meteor/issues/2573#issuecomment-101099328
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

Tinytest.add('Forms - submit event receives errors when form is invalid', function (test) {
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

  div.find('input').trigger('submit');
  test.equal(didCallHandler, true, 'submit handler not called');
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

Template.simpleForm.events({
  'mockSubmit': function (e, tmpl) {
    Forms.submit( e, tmpl );
  }
});

Tinytest.add('Forms - Event detection - submit event is triggered', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var newForm = makeForm(null, function () {
    return doc.get();
  });

  var templateInstance = newForm.templateInstance;

  newForm.div.find('form').on('submit', function (e) {
    e.preventDefault();
    // test.equal(e.doc, {
    //   name: 'joe'
    // });
    didCallHandler = true;
  });

  templateInstance.$('input').trigger('submit');
  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - Event detection - submit method is called', function (test) {
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

  div.on('mockSubmit', function (e) {
    test.equal(_.has(e, 'doc'), true);
  });

  div.find('input').trigger('mockSubmit');

  test.equal(didCallHandler, true);
});

Tinytest.add('Forms - Event detection - change event is bypassed when Forms.changeEventIsActive is set to "false"', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var newForm = makeForm('simpleForm', function () {
    return doc.get();
  });

  var div = newForm.div;
  var templateInstance = newForm.templateInstance;

  Forms.eventHandlerIsActive(templateInstance, 'change', false);

  div.find('input').val('william');

  div.find('form').on('change', function (e) {
    didCallHandler = true;
  });

  div.find('input').trigger('change');

  Tracker.flush();

  test.notEqual(templateInstance.doc.get().name, 'william', 'change event not bypassed');
  test.equal(didCallHandler, true, 'change event handler not called');
});

Tinytest.add('Forms - Event detection - submit event is bypassed when Forms.submitEventIsActive is set to "false"', function (test) {
  var didCallHandler = false;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var newForm = makeForm('simpleForm', function () {
    return doc.get();
  });

  var div = newForm.div;
  var templateInstance = newForm.templateInstance;

  Forms.eventHandlerIsActive(templateInstance, 'submit', false);

  templateInstance.$('form').on('documentSubmit', function (e) {
    didCallHandler = true;
  });

  templateInstance.$('input').trigger('submit');
  test.notEqual(didCallHandler, true, 'submit event handler not called');
});

Tinytest.add('Forms - Event detection - submit event does not propagate to outer enclosing templates', function (test) {
  var didCallOuterHandler = false;
  var didCallInnerHandler = 0;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var newForm = makeForm('nestedForms', function () {
    return doc.get();
  });

  var templateInstance = newForm.templateInstance;

  // outer form
  templateInstance.$('.outerForm').on('documentSubmit', function (e) {
    didCallOuterHandler = true;
  });

  // inner form
  templateInstance.$('.simpleForm').on('documentSubmit', function (e) {
    didCallInnerHandler++;
  });

  // trigger submit in inner form
  templateInstance.$('.simpleForm').trigger('submit');

  test.equal( didCallOuterHandler, false, 'submit handler of outer form called');
  test.equal( didCallInnerHandler, 1, 'submit handler of inner form called ' + didCallInnerHandler + ' times!');
});

Tinytest.add('Forms - Event detection - change event does not propagate to outer enclosing templates', function (test) {

  //
  // var didCallHandler = false;
  // var doc = new ReactiveVar({doc: {name: 'joe'}});
  // var newForm = makeForm('simpleForm', function () {
  //   return doc.get();
  // });
  //
  // var div = newForm.div;
  // var templateInstance = newForm.templateInstance;
  //
  // Forms.eventHandlerIsActive(templateInstance, 'change', false);
  //
  // div.find('input').val('william');
  //
  // div.find('form').on('change', function (e) {
  //   didCallHandler = true;
  // });
  //
  // div.find('input').trigger('change');
  //
  // Tracker.flush();
  //
  // test.notEqual(templateInstance.doc.get().name, 'william', 'change event not bypassed');
  // test.equal(didCallHandler, true, 'change event handler not called');
  //
  //

  var didCallOuterHandler = false;
  var didCallInnerHandler = 0;
  var doc = new ReactiveVar({doc: {name: 'joe'}});
  var newForm = makeForm('nestedForms', function () {
    return doc.get();
  });

  var templateInstance = newForm.templateInstance;

  templateInstance.$('.simpleForm input').val('william');

  // outer form
  templateInstance.$('.outerForm').on('documentChange', function (e) {
    didCallOuterHandler = true;
  });

  // inner form
  templateInstance.$('.simpleForm').on('documentChange', function (e) {
    didCallInnerHandler++;
  });

  // trigger submit in inner form
  templateInstance.$('.simpleForm input').trigger('change');

  Tracker.flush();

  test.equal(templateInstance.doc.get().name, 'william', 'change event did not update the document');
  test.equal( didCallOuterHandler, false, 'change handler of outer form called');
  test.equal( didCallInnerHandler, 1, 'change handler of inner form called ' + didCallInnerHandler + ' times!');
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
