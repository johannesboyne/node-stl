var 
assert								= require('assert'),
NodeStl								= require('../');

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
});
