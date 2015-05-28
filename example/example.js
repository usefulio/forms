if (Meteor.isClient) {
  Template.hello.helpers({
    schema: function () {
      return new Schema({
        firstName: new Validator(function (val) {
          return Match.test(val, String) && val.length > 2;
        })
      });
    }
  });

  Template.hello.events({
    'documentSubmit': function (e) {
      console.log(e.doc);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
