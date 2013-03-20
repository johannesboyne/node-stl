var 
assert								= require('assert'),
NodeStl								= require('../');

describe('should load an STL and measure volume and weight', function () {
	it('load an ascii file', function(){
		var a = new NodeStl(__dirname + '/test_data/WALLY_1plate.stl');
		assert.equal(a.volume, 21.87511539650792);
		console.log(a.volume, a.weight);
	});
	it('load a binary file', function(){
		var b = new NodeStl(__dirname + '/test_data/RasPiCaseLight.stl');
		assert.equal(b.volume, 1.0919298479039214);
		console.log(b.volume, b.weight);
	});
});