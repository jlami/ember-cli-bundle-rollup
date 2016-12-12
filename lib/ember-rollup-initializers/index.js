import files from './files';

export default function(app, config) {
	files.forEach(function(file) {
		let callType = file.isInstance ? 'instanceInitializer' : 'initializer';
		app[callType](file.export);
	});
}
