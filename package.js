Package.describe({
	name: 'useful:forms',
	version: '1.0.0-1',
	summary: 'Form Template Mixin',
	git: 'https://github.com/usefulio/forms',
	documentation: 'README.md'
});

Package.onUse(function(api) {

	api.versionsFrom('1.1');

	// ====== BUILT-IN PACKAGES =======

	api.use([
		'templating'
		, 'underscore'
	], ['client', 'server']);

	api.use([
		'jquery'
		, 'reactive-dict'
		, 'reactive-var'
		, 'mongo'
	], 'client');

	// ====== 3RD PARTY PACKAGES =======

	// ====== BOTH =======

	// ====== SERVER =======

	// ====== CLIENT =======

	api.addFiles([
		'lib/forms.js'
		, 'lib/regexps.js'
		, 'lib/validators.js'
	], 'client');

	// ====== EXPORTS =======

	api.export('Forms');
});

Package.onTest(function(api) {
	api.use('tinytest');
	api.use('useful:forms');
	api.use([
		'templating'
		, 'underscore'
		, 'jquery'
		, 'reactive-dict'
		, 'reactive-var'
		, 'mongo'
	]);

	// Templates
	api.addFiles([
		'tests/simpleForm.html'
	], 'client');

	// Tests
	api.addFiles([
		'tests/forms.js'
	], 'client');


});
