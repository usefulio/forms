// I want to specify the fields to be validated
// and I don't want to use callbacks

// I want to specify validation triggers

// I want to be able to get errors back out reactively

// I'M NOT CHECKING THAT I WROTE THE FORM CORRECTLY
// > I JUST WANT TO MAKE SURE THAT THE USER ENTERED
// > VALID INPUT BEFORE SAVING IT TO THE DATABASE!!!!

// So, let's specify what makes a field valid instead
// of what makes a document valid and then look at 
// what inputs are in the form we are managing and validate
// against that!

// provide comprehensive validations, including regexs

// support fromForm

// support document defaults?

// support auto-save, auto-insert, auto-update

// Document cleanup/conversion should happen separately
// in before hooks. That's a different package.

// super easy to override/customize

var noop = function(){};

// these keys are not strict validators, but can
// be specified on a "schema" definition
var specialKeys = ['convert', 'message'];

Forms = {
	_validators: {}
	, _ruleSets: {}
	, _converters: {}
};

Forms.validators = function(validators){
	_.extend(this._validators, validators);
};

Forms.converters = function(converters){
	_.extend(this._converters, converters);
};

Forms.ruleSet = function(name, rules){
	// XXX be able to mix together multiple rulesets
	// under the same name? E.g. mix standard rulesets
	this._ruleSets[name] = rules;
};

Forms.mixin = function(template, config){

	template.onCreated(function(){
		var self = this;
		self._errors = new Mongo.Collection(null);
		self._formData = {};
		self._config = config;

		_.each(config, function(value, key){
			// init the form data
			self._formData[key] = {};

			if(_.isString(value)){
				// named ruleset
				Forms._ruleSets[key] = Forms._ruleSets[value];
			}else{
				// XXX this requires all form ids to be unique
				// across the app if they are going to have
				// different rulesets... not excellent
				// instead we should store passed in ruleSets
				// on the template instance and lookup there first
				Forms.ruleSet(key, value);
			}
		});

		self.formData = function (formSelector) {
			// XXX run any converters
			return self._formData[formSelector];
		};

		self.setValue = function (formSelector, fieldName, value) {
			var ruleSet = Forms._ruleSets[formSelector];
			if(ruleSet[fieldName]){
				if(_.isFunction(ruleSet[fieldName].convert)){
					value = ruleSet[fieldName].convert(value);
				}else if(_.isString(ruleSet[fieldName].convert)){
					value = Forms._converters[ruleSet[fieldName].convert](value);
				}
			}
			self._formData[formSelector][fieldName] = value;
		};

		self.toggleValue = function (formSelector, fieldName, value) {
			var values = self._formData[formSelector][fieldName] || []
				, currentIndex = values.indexOf(value);
			if(currentIndex === -1){
				values.push(value);
			}else{
				values.splice(currentIndex, 1);
			}
			self.setValue(formSelector, fieldName, values);
		};

		self.validate = function (formSelector) {
			// get the data and rules for the form
			var data = self._formData[formSelector]
				, ruleSet = Forms._ruleSets[formSelector];

			self.errors().remove({}, noop);

			_.each(data, function(value, key){
				// look up the validations to be run
				_.each(_.omit(ruleSet[key], specialKeys), function(options, ruleName){
				// run the validations and set the errors.
					var context = {
						value: value
						, fieldName: key
						, options: options
						, values: data
						, validators: Forms._validators
					};
					if(!Forms._validators[ruleName](context)){
						self._errors.upsert({
							form: formSelector
							, field: key
						}
						, {
							form: formSelector
							, field: key
							, error: ruleName
							, value: value
							, message: ruleSet[key].message
						}, noop);
					}
				});
			});

			return self.isValid();
		};

		self.isValid = function (formSelector) {
			return self.errors().find({form: formSelector}).count() === 0;
		}

		self.errors = function () {
			return self._errors;
		};

		self.reset = function (formSelector) {
			self.$(formSelector).reset();
		};

		self.getValueFromElement = function(formSelector, el){
			var $el = $(el);

			if($el.attr('name')){
				if($el.attr('type') === 'checkbox'){
					if($el.attr('value')){
						self.toggleValue(formSelector, $el.attr('name'), $el.attr('value'));
					}else{
						self.setValue(formSelector, $el.attr('name'), el.checked);
					}
				}else{
					self.setValue(formSelector, $el.attr('name'), el.value);
				}
			}
		};
	});

	template.onRendered(function(){
		var self = this;
		_.each(self._formData, function(value, key){
			// extract initial form data
			self.$([
				key + ' input[name]'
				, key + ' textarea[name]'
				, key + ' select[name]'
			].join(', ')).each(function(index, el){
				self.getValueFromElement(key, el);
			});
		});
	});


	var submitHandlers = {}
	_.each(config, function(value, key){
		submitHandlers['submit ' + key] = function (e, tmpl) {
			e.preventDefault();
			tmpl.validate(key);
		}
	});
	template.events(submitHandlers);

	var changeHandlers = {};
	_.each(config, function(value, key){
		changeHandlers['change ' + key] = function(e, tmpl) {
			tmpl.getValueFromElement(key, e.target);
		};
		return changeHandlers;
	});
	template.events(changeHandlers);

	template.helpers({
		errorsFor: function (fieldName, formSelector) {
			var selector = { field: fieldName };
			// if(formSelector){ selector.form = formSelector; }
			return Template.instance()._errors.find(selector);
		}
		, errorFor: function (fieldName, formSelector) {
			var selector = { field: fieldName };
			// if(formSelector){ selector.form = formSelector; }
			return Template.instance()._errors.findOne(selector);
		}
		, errors: function (formSelector) {
			return Template.instance().errors().find({form: formSelector});
		}
	});

};