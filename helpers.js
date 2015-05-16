Template.registerHelper("checkboxIsOn", function(value){
	return value === true || value === "on";
});

Template.registerHelper("optionIsSelected", function(value, desiredValue){
	return value === desiredValue;
});