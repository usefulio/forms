// Setup
Forms.formMixin(Template.nestedForm);
Forms.formMixin(Template.simpleForm);
Forms.subDocMixin(Template.subdoc);

// Untils
function makeForm(formName, options) {
  var div = $('<div>');
  formName = formName || "simpleForm";
  options = options || {};
  Blaze.renderWithData(Template[formName], options, div[0]);
  return div;
}

// Tests
Tinytest.add('Forms - documentChange event', function (test) {
  var div = makeForm()
    , eventDidFire = false;

  div.on('documentChange', function (e) {
    test.equal(e.doc, {"firstName":""});
    eventDidFire = true;
  });
  div.find('input').trigger('change');

  test.equal(eventDidFire, true);
});

Tinytest.add('Forms - documentSubmit event', function (test) {
  var div = makeForm()
    , eventDidFire = false;

  div.on('documentSubmit', function (e) {
    test.equal(e.doc, {});
    eventDidFire = true;
  });
  div.find('form').trigger('submit');

  test.equal(eventDidFire, true);
});

Tinytest.add('Forms - propertyChange event', function (test) {
  var div = makeForm()
    , eventDidFire = false;

  div.on('documentChange', function (e) {
    test.equal(e.doc, {
      firstName: "joe"
    });
    eventDidFire = true;
  });
  var changeEvent = $.Event('propertyChange');
  changeEvent.propertyName = 'firstName';
  changeEvent.propertyValue = 'joe';
  div.find('input').trigger(changeEvent);

  test.equal(eventDidFire, true);
});

Tinytest.add('Forms - change event', function (test) {
  var div = makeForm()
    , eventDidFire = false;

  div.on('documentChange', function (e) {
    test.equal(e.doc, {
      firstName: "joe"
    });
    eventDidFire = true;
  });
  div.find('input').val('joe');
  div.find('input').trigger('change');

  test.equal(eventDidFire, true);
});

Tinytest.add('Forms - nested change event', function (test) {
  var div = makeForm('nestedForm')
    , eventDidFire = false;

  div.on('documentChange', function (e) {
    test.equal(e.doc, {
      profile: {
        firstName: "joe"
      }
    });
    eventDidFire = true;
  });
  div.find('input').val('joe');
  div.find('input').trigger('change');

  test.equal(eventDidFire, true);
});


