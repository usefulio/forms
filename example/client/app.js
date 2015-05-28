Template.exampleForms.onCreated(function () {
  var tmpl = this;
  tmpl.profile = new ReactiveVar();
});

Template.exampleForms.helpers({
  schema: function () {
    return new Schema({
      firstName: new Validator(function (val) {
        return Match.test(val, String) && val.length > 2;
      })
    });
  }
  , item: function () {
    var tmpl = Template.instance();
    return tmpl.profile.get();
  }
  , print: function (value) {
    return JSON.stringify(value, null, 2);
  }
});

Template.exampleForms.events({
  'documentSubmit': function (e, tmpl) {
    tmpl.profile.set(e.doc);
  }
});
