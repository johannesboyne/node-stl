var 
assert								= require('assert'),
NodeStl								= require('../');
request								= require('request');

describe('should load an STL and measure volume and weight', function () {
	it('load an ascii file', function() {
		// source for this stl: http://www.thingiverse.com/thing:47956
		var a = new NodeStl(__dirname + '/test_data/WALLY_1plate.stl');
		assert.equal(a.volume, 21.87511539650792);
	});
	it('load a binary file', function() {
		// source for this stl: http://www.thingiverse.com/thing:61532
		var b = new NodeStl(__dirname + '/test_data/RasPiCaseLight.stl');
		assert.equal(b.volume, 1.0919298479039214);
	});
	it('loads the petosaurs with the right dimensions', function() {
		// source for this stl: http://www.thingiverse.com/thing:1607628
		var c = new NodeStl(__dirname + '/test_data/Pterosaur_FDM.stl');
    assert.deepEqual(c.boundingBox.map(function (bbe) { return Math.round(bbe) }), 
      [60,45,50])
	});
	it('loads a file buffer', function() {
		var fs = require('fs');
		var file_buf = fs.readFileSync(__dirname + '/test_data/WALLY_1plate.stl');
		var a = new NodeStl(file_buf);
		assert.equal(a.volume, 21.87511539650792);
	});
	it('loads a file from url',function(done){
		var requestSettings = {
		   method: 'GET',
		   url: 'https://s3.amazonaws.com/minifactory-stl/WALLY_1plate.stl',
		   encoding: null,
		};
		request(requestSettings, function(error, response, file) {
			var a = new NodeStl(file);
			assert.equal(a.volume, 21.87511539650792);
			done(null);
		});
	}).timeout('5000');
});
