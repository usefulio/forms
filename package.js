Package.describe({
	name: 'useful:forms',
	version: '0.0.11',
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

	api.addFiles('forms.js', 'client');
	api.addFiles('schema.js', ['client', 'server']);

	// ====== EXPORTS =======

	api.export('Forms');
	api.export('Schema');
	api.export('Validator');
});

Package.onTest(function(api) {
	api.use([
		'tinytest'
		, 'underscore'
		, 'jquery'
	]);
	api.use('templating');

	api.use('useful:forms');

	api.addFiles([
		'forms-tests.html'
		, 'forms-tests.js'
	], 'client');

	api.addFiles([
		'schema-tests.js'
	], ['client', 'server']);
});
