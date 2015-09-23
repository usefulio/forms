Package.describe({
	name: 'useful:forms',
	version: '1.0.3',
	summary: 'Fully reactive forms which don\'t mess with your html',
	git: 'https://github.com/usefulio/forms',
	documentation: 'README.md'
});

Package.onUse(function(api) {

	api.versionsFrom('1.1');

	// ====== BUILT-IN PACKAGES =======

	api.use([
		'templating'
		, 'underscore'
		, 'check'
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
		, 'tracker'
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
