Schema = function (schemaDefinition, options) {
  if (!(this instanceof Schema))
    return new Schema(schemaDefinition, options);

  var self = this;
  self.childProperties = schemaDefinition;
  _.extend(self, options);
};

Schema.Array = function (schemaDefinition, options) {
  if (!(this instanceof Schema.Array))
    return new Schema.Array(schemaDefinition, options);

  var self = this;
  self.childValidation = schemaDefinition;
  _.extend(self, options);
};

Schema.Error = Meteor.makeErrorType('Schema.Error', function (schema, errors) {
  this.schema = schema;
  this.errors = errors;
  this.message = 'some fields are invalid';
});

Schema.Error.prototype.toString = function () {
  return this.message;
};

Schema.validate = function (value, validator) {
  if (!validator)
    throw new Error('Expected validator');
  if (_.isFunction(validator.validate))
    return validator.validate(value);
  else
    throw new Error('Unknow validation type');
};

Schema.child = function (schema, fieldName) {
  if (schema instanceof Schema.Array)
    return schema && schema.childValidation;
  else
    return schema && schema.childProperties && schema.childProperties[fieldName];
};

Schema.prototype.validate = function (value) {
  var self = this;
  
  var validationErrors = {};
  _.each(self.childProperties, function (a, key) {
    var error = Schema.validate(value[key], a);
    if (error !== true)
      validationErrors[key] = error;
  });

  if (_.any(validationErrors))
    return new Schema.Error(self, validationErrors);
  else
    return true;
};

Schema.prototype.assert = function(value) {
  var result = this.validate(value);
  if (result !== true)
    throw result;
};

Schema.Array.prototype.validate = function (value) {
  if (_.isUndefined(value) || _.isNull(value))
    return true;
  if (!_.isArray(value))
    return new Error('not an array');

  var self = this;
  var errors = _.chain(value)
    .map(function (a) {
      return self.childValidation.validate(a);
    })
    .filter(function (a) {
      return a !== true;
    })
    .flatten()
    .value();

  if (errors.length)
    return new Schema.Error(self, errors);
  else
    return true;
};

Validator = function (validateFn, transformFn, message) {
  if (!(this instanceof Validator))
    return new Validator(validateFn, transformFn, message);

  var args = _.filter(_.toArray(arguments), _.identity);

  if (_.isFunction(args[0]))
    this._validate = args.shift();
  if (_.isFunction(args[0]))
    this._transform = args.shift();
  if (_.isString(args[0]))
    this._message = args.shift();

  if (args.length)
    throw new Error('Too many arguments.');
  if (!_.isFunction(this._validate))
    throw new Error('Missing validate function.');
};

Validator.Error = Meteor.makeErrorType('Validator.Error', function (error, value, message) {
  this.validationResult = error;
  this.validationValue = value;
  this.message = message || "invalid";
});

Validator.Error.prototype.toString = function () {
  return this.message;
};

Validator.prototype.assert = function (value) {
  var error = this.validate(value);
  if (error !== true)
    throw error;
};

Validator.prototype.validate = function (value) {
  value = this.transform(value);
  var error = this._validate(value);
  if (error === true)
    return true;
  if (error)
    return error;

  return new Validator.Error(error, value, this._message);
};

Validator.prototype.transform = function (value) {
  if (_.isFunction(this._transform))
    value = this._transform(value);
  return value;
};
