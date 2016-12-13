/* jshint node: true */
//'use strict';

var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var path = require('path');
var fs = require('fs');
var stew = require('broccoli-stew');
var mergeTrees = require('ember-cli/lib/broccoli/merge-trees');
var CachingWriter = require('broccoli-caching-writer');

//module.exports = {
//  name: 'ember-cli-bundle-rollup',
//};
//
//return;

RollupInitializers.prototype = Object.create(CachingWriter.prototype);
RollupInitializers.prototype.constructor = RollupInitializers;
function RollupInitializers(tree, options) {
	CachingWriter.call(this, [tree], {
	    name: options.name,
	    annotation: options.annotation,
	    persistentOutput: false
	  });
	//return new RollupInitializers(tree, options);
}

RollupInitializers.prototype.build = function() {
	let output = "";
	let imports = "";
	let counter = 0;
	
	let inputFiles = this.listEntries();
	inputFiles.forEach(function(key) {
		if (!key.relativePath.endsWith(".js")) return;//TODO: to es5
		let isInstance = key.relativePath.includes("/instance-");
		let name = "initializer" + (++counter);
		imports += "import " + name + " from '" + key.relativePath.slice(0, -3) + "';\n";
		
		output += "\t{isInstance: " + isInstance + ", export: " + name + "},\n";
	});
	
	//console.log(imports + "\nexport default [\n" + output + "];");
	fs.writeFileSync(path.join(this.outputPath, 'files.js'), imports + "\n export default [\n" + output + "];");
};

var oldjavascript = EmberApp.prototype.javascript;
EmberApp.prototype.javascript = function() {
	var tree = this.appAndDependencies();
	
	//return tree;
	
	//console.log(this.options.outputPaths.app.js);
	//return oldjavascript.apply(this, arguments);
	var Rollup = require('broccoli-rollup');
	var nodeResolve = require('rollup-plugin-node-resolve');
	var commonjs = require('rollup-plugin-commonjs');
	var amd = require('rollup-plugin-amd');
	var preprocessTemplates = require('ember-cli-preprocess-registry/preprocessors').preprocessTemplates;
	
	var packages = stew.find([stew.find('node_modules/glimmer-engine/dist/es6/', { desDir: ''}), stew.rename('node_modules/ember-source/packages/', '/lib/', '/')]);
	
//	tree = stew.find([tree, stew.mv(packages, 'vendor/modules/')]);
	tree = stew.find([tree, packages]);//no overwrite, because modules should not have conflicting names
	let tree2 = stew.find([__dirname + '/lib'], { destDir: '/'});
		
	tree = stew.mv(tree, 'vendor/modules/', '/');
	tree = stew.find([tree, tree2], { overwrite: true });

	let baseurl = null;
	tree = preprocessTemplates(tree, {
	    registry: this.registry,
	    annotation: 'Rollup (templates)'
	  });
	  
	let init = new RollupInitializers(stew.find(tree, { include: ['test-es6/instance-initializers/*.js', 'test-es6/initializers/*.js'] }), {});
//	init = stew.debug(init, 'rollup-init');
	init = stew.mv(init, 'ember-rollup-initializers');
	tree = stew.find([tree, init]);
	tree = stew.debug(tree, 'rollup4');
	//return tree;
	
	let root;
  
	return new Rollup(tree, {
		rollup: {
			entry: 'test-es6/app.js',
			globals: {'require': 'require'},
			sourceMap: true,
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
//				amd(),
				{
					options: function(options) {
						//console.log(options.entry);
						baseurl = path.dirname(options.entry);
						root = path.resolve(baseurl, '..');
						options.banner = 'window.EmberENV = {"FEATURES":{}};' + fs.readFileSync(path.resolve(baseurl, '../vendor/loader/loader.js'));
						options.banner += fs.readFileSync(require.resolve('jquery'));
						options.footer = "var testes6app = testes6['default'].create(testes6.config.APP || {});";
						return options;
					},
					resolveId: function(id, loader) {
						if (id == 'fs' || id == 'path') console.log(id, loader);
						//if (id == 'backburner') return 'backburner.js';
						
//						if (id == 'ember/version' || id == './version' && path.dirname(path.relative(baseurl, loader)) === 'ember') {
//							return path.resolve(baseurl, 'version.js');
//						}
						
						var mapping = {
//							'ember/features' : 'features.js',
//							'./config/environment': 'config.js',
//							'ember': '../bower_components/ember/ember.js',
							//'ember': '../vendor/ember-cli-bundle-rollup/ember.js',
//							'ember-load-initializers': '..ember-load-initializers/index.js',
						};
						
						if (mapping[id]) {
//							console.log(fs.existsSync(loader));
//							console.log(fs.existsSync(path.resolve(loader, '..')));
//							console.log(fs.existsSync(path.resolve(loader, '../../')));
							//console.log(fs.existsSync(path.resolve(loader, '../../vendor')));
							return path.resolve(root, mapping[id]);
						} else if (loader) {
							let baseFile;
							if (id[0] !== '.') {
								baseFile = path.resolve(root, id)
							} else {
								baseFile = path.resolve(loader, '..', id);
							}
							
							if (fs.existsSync(baseFile + '.js')) {
//								if (baseFile === path.resolve(baseurl, 'router')) {
//									console.log('router from ' + loader);
//								}
									
								//console.log('found file ' + id);
								return baseFile + '.js';
							} else {
								let test = path.join(baseFile, 'index.js')
								if (fs.existsSync(test)) {
									//console.log('found index ' + id);
									return test;
								} else {
									return null;
								}
							}
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
					skip: true,
				}),
				commonjs(),
//				require('rollup-plugin-uglify')({}, require('uglify-js').minify),
			],
			targets: [
//				{
//					dest: 'assets/test-es6.amd.js',
//					format: 'amd',
//				},
				{
					dest: 'assets/test-es6.js',
					format: 'iife',
					moduleName: 'testes6',
				},
//				{
//					dest: 'assets/test-es6.es.js',
//					format: 'es',
//				}
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
  
//  treeForVendor() {
//  	return stew.log(stew.mv(path.join(__dirname, 'lib'), 'ember-cli-bundle-rollup'));//stew.find(__dirname, 'lib/**'));
//  },
};
