var fs = require('fs');

// Vertex
function Vertex (v1,v2,v3) {
	this.v1 = Number(v1);
	this.v2 = Number(v2);
	this.v3 = Number(v3);
}

// Vertex Holder
function VertexHolder (vertex1,vertex2,vertex3) {
	this.vert1 = vertex1;
	this.vert2 = vertex2;
	this.vert3 = vertex3;
}

// transforming a Node.js Buffer into a V8 array buffer
function _toArrayBuffer (buffer) {
	var 
	ab = new ArrayBuffer(buffer.length),
	view = new Uint8Array(ab);
	
	for (var i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
}

// calculation of the triangle volume
// source: http://stackoverflow.com/questions/6518404/how-do-i-calculate-the-volume-of-an-object-stored-in-stl-files
function _triangleVolume (vertexHolder) {
	var 
	v321 = Number(vertexHolder.vert3.v1 * vertexHolder.vert2.v2 * vertexHolder.vert1.v3),
	v231 = Number(vertexHolder.vert2.v1 * vertexHolder.vert3.v2 * vertexHolder.vert1.v3),
	v312 = Number(vertexHolder.vert3.v1 * vertexHolder.vert1.v2 * vertexHolder.vert2.v3),
	v132 = Number(vertexHolder.vert1.v1 * vertexHolder.vert3.v2 * vertexHolder.vert2.v3),
	v213 = Number(vertexHolder.vert2.v1 * vertexHolder.vert1.v2 * vertexHolder.vert3.v3),
	v123 = Number(vertexHolder.vert1.v1 * vertexHolder.vert2.v2 * vertexHolder.vert3.v3);
	return Number(1.0/6.0)*(-v321 + v231 + v312 - v132 - v213 + v123);
}

// parsing an STL ASCII string
function _parseSTLString (stl) {
	var totalVol = 0;
	// yes, this is the regular expression, matching the vertexes
	// it was kind of tricky but it is fast and does the job
	var vertexes = stl.match(/facet\s+normal\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+outer\s+loop\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+endloop\s+endfacet/g);

	vertexes.forEach(function (vert) {
		var preVertexHolder = new VertexHolder();
		vert.match(/vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s/g).forEach(function (vertex, i) {
			var tempVertex	= vertex.replace('vertex', '').match(/[-+]?[0-9]*\.?[0-9]+/g);
			var preVertex	= new Vertex(tempVertex[0],tempVertex[1],tempVertex[2]);
			preVertexHolder['vert'+(i+1)] = preVertex;
		});
		var partVolume = _triangleVolume(preVertexHolder);
		totalVol += Number(partVolume);
	})

	var volumeTotal = Math.abs(totalVol)/1000;
	return {
		volume: volumeTotal, 		// cubic cm
		weight: volumeTotal * 1.04	// gm
	}
}

// parsing an STL Binary File
// (borrowed some code from here: https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js)
function _parseSTLBinary (buf) {
	buf = _toArrayBuffer(buf);

	var 
	headerLength	= 80,
	dataOffset		= 84,
	faceLength		= 12*4 + 2,
	le = true; // is little-endian

	var 
	dvTriangleCount	= new DataView(buf, headerLength, 4),
	numTriangles	= dvTriangleCount.getUint32(0, le),
	totalVol		= 0;

	for (var i = 0; i < numTriangles; i++) {
		var 
		dv			= new DataView(buf, dataOffset + i*faceLength, faceLength),
		normal		= new Vertex(dv.getFloat32(0, le), dv.getFloat32(4, le), dv.getFloat32(8, le)),
		vertHolder	= new VertexHolder();
		for(var v = 3; v < 12; v+=3) {
			var vert = new Vertex(dv.getFloat32(v*4, le), dv.getFloat32((v+1)*4, le), dv.getFloat32( (v+2)*4, le ) );
			vertHolder['vert'+(v/3)] = vert;
		}
		totalVol += _triangleVolume(vertHolder);
	}

	var volumeTotal = Math.abs(totalVol)/1000;
	return {
		volume: volumeTotal,		// cubic cm
		weight: volumeTotal * 1.04	// gm
	}
}

// NodeStl
// =======
// > var stl = NodeStl(__dirname + '/myCool.stl');
// > console.log(stl.volume + 'cm^3');
// > console.log(stl.weight + 'gm');
function NodeStl (stlPath) {
	var 
	buf = fs.readFileSync(stlPath),
	isAscii = true;
	
	for (var i=0, len=buf.length; i<len; i++) {
		if (buf[i] > 127) { isAscii=false; break; }
	}

	if (isAscii)
		return _parseSTLString(buf.toString());
	else
		return _parseSTLBinary(buf);
}

module.exports = NodeStl;
