// Setup
Forms.formMixin(Template.nestedForm);
Forms.formMixin(Template.arrayForm);
Forms.formMixin(Template.simpleForm);
Forms.formMixin(Template.validationForm);
Forms.fieldMixin(Template.field);

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

Tinytest.add('Forms - documentInvalid event', function (test) {
  var div = makeForm(null, {schema: {validate: function () {return false;}}})
    , eventDidFire = false;

  div.on('documentInvalid', function (e) {
    test.equal(e.doc, {});
    eventDidFire = true;
  });
  div.find('form').trigger('submit');

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

Tinytest.add('Forms - array change event', function (test) {
  var div = makeForm('arrayForm', {doc: {users: [{}]}})
    , eventDidFire = false;

  div.on('documentChange', function (e) {
    test.equal(e.doc, {
      users: [{
        firstName: "joe"
      }]
    });
    eventDidFire = true;
  });
  div.find('input').val('joe');
  div.find('input').trigger('change');

  test.equal(eventDidFire, true);
});

Tinytest.add('Forms - documentSubmit event not fired when doc is invalid', function (test) {
  var div = makeForm(null, {schema: {validate: function () {return false;}}})
    , eventDidFire = false;

  div.on('documentSubmit', function (e) {
    test.equal(e.doc, {});
    eventDidFire = true;
  });
  div.find('form').trigger('submit');

  test.equal(eventDidFire, false);
});

Tinytest.add('Forms - validation context is available at the field level', function (test) {
  var div = makeForm('validationForm', {schema: new Schema({
      firstName: Validator(function () {
        return false;
      })
    })})
    ;

  div.find('input').trigger('change');
  
  test.equal(div.find('.invalid').text(), 'invalid');
});

Tinytest.add('Forms - validation context is available at the object level', function (test) {
  var div = makeForm('nestedForm', {schema: new Schema({
      profile: Validator(function () {
        return false;
      })
    })})
    ;

  div.find('input').trigger('change');
  
  test.equal(div.find('.invalid').text(), 'invalid');
});

Tinytest.add('Forms - validation context is available at the array level', function (test) {
  var div = makeForm('arrayForm',{doc: {users: [{}]}, schema: new Schema({
      users: Schema.Array(Validator(function () {
        return false;
      }))
    })})
    ;

  div.find('input').trigger('change');
  
  test.equal(div.find('.invalid').text(), 'invalid');
});