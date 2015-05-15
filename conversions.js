Forms.conversions({
	string: function(value){
		return ''+value;
	}
	, number: function(value){
		return +value;
	}
});