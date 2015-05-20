// Tests
Tinytest.add('Schema - simple schema validation', function (test) {
  var schema = new Schema({
    name: new Validator(function (val) {
      return val === 'name';
    })
  });

  test.equal(schema.validate({name: 'name'}), true);
  test.instanceOf(schema.validate({name: 'other'}), Schema.Error);
  test.throws(function () {
    schema.assert({name: 'other'});
  });
});