var 
assert	= require('assert'),
fs		= require('fs'),
teststl = fs.readFileSync(__dirname + '/test_data/message_ring_customizer_20130319-23308-fy9v62-0.stl', 'utf-8'),
NodeStl = require('../'),
stl     = new NodeStl(teststl);

// describe('simple parsing test', function () {
// 	it('return an object from dxf', function(){
// 		// console.dir(stl.layers['_VT_ohnePIDs_EG_SP'].texts);
// 		assert.equal(1, 1);
// 	});
// });
