Template.registerHelper("checked", function(value, defaultValue){
	return value === true || value === "on" || defaultValue === true ? "checked" : "";
});

Template.registerHelper("selected", function(value, desiredValue){
	return value === desiredValue ? "selected" : "";
});