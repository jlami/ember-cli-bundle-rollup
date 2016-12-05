/* jshint node: true */
//'use strict';

var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var path = require('path');
var stew = require('broccoli-stew');
var mergeTrees = require('ember-cli/lib/broccoli/merge-trees');


//module.exports = {
//  name: 'ember-cli-bundle-rollup',
//};
//
//return;

var oldjavascript = EmberApp.prototype.javascript;
EmberApp.prototype.javascript = function() {
	var tree = this.appAndDependencies();
	
	//return tree;
	
	console.log(this.options.outputPaths.app.js);
	//return oldjavascript.apply(this, arguments);
	var Rollup = require('broccoli-rollup');
	var nodeResolve = require('rollup-plugin-node-resolve');
	var commonjs = require('rollup-plugin-commonjs');
	var fs = require('fs');
	var amd = require('rollup-plugin-amd');
	
	tree = stew.find([tree, stew.mv(stew.rename('node_modules/ember/packages/', '/lib/', '/'), 'test-es6/')]);
	//return tree;
	tree = stew.mv(tree, 'vendor/modules/', 'test-es6/');
	//tree = stew.debug(tree, 'rollup3');
	
	return new Rollup(tree, {
		rollup: {
			entry: 'test-es6/app.js',
			//dest: 'test-es6/test-es6.es6.js',
//			plugins: [
//				nodeResolve({
//					jsnext: true,
//					main: true,
//					browser: true,
//				}),
//				commonjs(),
//			],
//		resolveExternal: function(id) {
//			console.log(id);
//			return null;
//		},
			plugins: [
				amd(),
				{
					resolveId: function(id, loader) {
						var mapping = {
							'./config/environment': '../vendor/ember-cli-bundle-rollup/config.js',
//							'ember': '../bower_components/ember/ember.js',
							//'ember': '../vendor/ember-cli-bundle-rollup/ember.js',
//							'ember-load-initializers': '..ember-load-initializers/index.js',
						};
						
						if (mapping[id]) {
//							console.log(fs.existsSync(loader));
//							console.log(fs.existsSync(path.resolve(loader, '..')));
//							console.log(fs.existsSync(path.resolve(loader, '../../')));
							//console.log(fs.existsSync(path.resolve(loader, '../../vendor')));
							return path.resolve(loader, '..', mapping[id]);
						} else {
//							if (loader) {
//								var file = path.resolve(loader, '..', id, 'index.js');
//								console.log(file, fs.existsSync(file));
//							}
							return null;
						}
					}
				},
				nodeResolve({
					jsnext: true,
					main: true,
					browser: true,
				}),
				commonjs(),
			],
			targets: [
				{
					dest: 'assets/test-es6.js',
					format: 'amd',
				},
				{
					dest: 'assets/test.es6.iife.js',
					format: 'iife',
					moduleName: 'test-es6',
				}
			],
//			external: function(id) {
//				var res = path.resolve.bind(this.scope.declarations.module.id);
//				var exts = [
//					'./config/environment',
//				];
//				
//				var result = exts.indexOf(id) !== -1;
//				
//				if (!result && this.modules.length) {
//					var base = this.modules[this.modules.length-1].id;
//					console.log(base);
//					var absexts = exts.map(function(i) { return path.resolve(base, i); });
//
//					result = absexts.indexOf(id) !== -1;
//				}
//				
//				console.log(id, result);
//				return result;
//			},
		}
	});
};

var oldtoTree = EmberApp.prototype.toTree;
EmberApp.prototype.toTree = function() {
	//TODO: clear all js transforms?
	this.registry.remove('js', 'ember-cli-babel');
	return oldtoTree.apply(this, arguments);
}

EmberApp.prototype._addonTree = function() {
	if (this._cachedAddonTree) {
    return this._cachedAddonTree;
  }

  var addonTrees = mergeTrees(this.addonTreesFor('addon'), {
    overwrite: true,
    annotation: 'TreeMerger (addons)'
  });

  return this._cachedAddonTree = [
    this._concatFiles(addonTrees, {
      inputFiles: ['**/*.css'],
      outputFile: '/addons.css',
      allowNone: true,
      annotation: 'Concat: Addon CSS'
    }),

    stew.find(addonTrees, '**/*.js')
  ];
}

module.exports = {
  name: 'ember-cli-bundle-rollup',
  
  treeForVendor() {
  	return stew.log(stew.mv(path.join(__dirname, 'lib'), 'ember-cli-bundle-rollup'));//stew.find(__dirname, 'lib/**'));
  },
};