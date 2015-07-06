// context is: val, options, values, fieldName, validators

Forms.validators = {
	oneOf: function(context){
		return _.contains(context.options, context.value);
	}
	, min: function(context){
		return _.isNumber(context.value) && context.value >= context.options;
	}
	, max: function(context){
		return _.isNumber(context.value) && context.value <= context.options;
	}
	, type: function(context){
		var valid = false;
		switch(context.options){
			case String:
				valid = _.isString(context.value);
				break;
			case Number:
				valid = _.isNumber(context.value) && !_.isNaN(context.value);
				break;
			case Boolean:
				valid = _.isBoolean(context.value);
				break;
			case Date:
				valid = _.isDate(context.value);
				break;
			case Object:
				valid = _.isObject(context.value);
				break;
			case Array:
				context.options = context.options[0];
				valid = _.isArray(context.value) && _.every(context.value, function(item){
					return validators.type(_.defaults({
						value: item
					}, context));
				});
				break;
		}
		return valid;
	}
	, minLength: function(context){
		return _.isString(context.value) && context.value.length >= context.options;
	}
	, maxLength: function(context){
		return _.isString(context.value) && context.value.length <= context.options;
	}
	, minCount: function(context){
		return _.isArray(context.value) && context.value.length >= context.options;
	}
	, maxCount: function(context){
		return _.isArray(context.value) && context.value.length <= context.options;
	}
	, regex: function(context){
		// can take a regex or { pattern: "asdf", flags: "i" } or an array of either
		var valid = false;
		if(_.isRegExp(context.options)){
			valid = context.options.test(context.value);
		}else if(_.isObject(context.options)){
			valid = (new RegExp(context.options.pattern, context.options.flag)).test(context.value);
		}else if(_.isArray(context.options)){
			valid = _.every(context.options, function(regex){
				return context.validations.regex(_.defaults({
					options: regex
				}, context));
			});
		}
		return valid;
	}
	, before: function(context){
		return (_.isNumber(context.value) || _.isDate(context.value)) && context.value < context.values[context.options];
	}
	, after: function(context){
		return (_.isNumber(context.value) || _.isDate(context.value)) && context.value > context.values[context.options];
	}
};