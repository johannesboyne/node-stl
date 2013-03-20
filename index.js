var BufferStream = require('bufferstream');

function Vertex (v1,v2,v3) {
	this.v1 = v1;
	this.v2 = v2;
	this.v3 = v3;
}

function VertexHolder (vertex1,vertex2,vertex3) {
	this.vert1 = vertex1;
	this.vert2 = vertex2;
	this.vert3 = vertex3;
}

function _signedVolumeOfTriangle (vertexHolder) {
	// console.dir(vertexHolder);
	var v321 = vertexHolder.vert3.v1*vertexHolder.vert2.v2*vertexHolder.vert1.v3;
	var v231 = vertexHolder.vert2.v1*vertexHolder.vert3.v2*vertexHolder.vert1.v3;
	var v312 = vertexHolder.vert3.v1*vertexHolder.vert1.v2*vertexHolder.vert2.v3;
	var v132 = vertexHolder.vert1.v1*vertexHolder.vert3.v2*vertexHolder.vert2.v3;
	var v213 = vertexHolder.vert2.v1*vertexHolder.vert1.v2*vertexHolder.vert3.v3;
	var v123 = vertexHolder.vert1.v1*vertexHolder.vert2.v2*vertexHolder.vert3.v3;
	return (1.0/6.0)*(-v321 + v231 + v312 - v132 - v213 + v123);
}

function _parseSTLString(stl) {
	// var
	// stream = new BufferStream({encoding:'utf8', size:'flexible'});

	// stream.split('\n');

	// var foundFacet = true, foundLoop = true, vertexCount = 0, preVertHolder, totalVol = 0, c=0, chunkStr;
	// stream.on('split', function (chunk, token) {
	// 	chunkStr = chunk.toString();

	// 	if (chunkStr.match(/facet/)) {
	// 		foundFacet = true;
	// 	} else if (chunkStr.match(/(outer loop)/)) {
	// 		foundLoop = true;
	// 		preVertHolder = new VertexHolder();
	// 		vertexCount = 0;
	// 	} else if (foundFacet && foundLoop && vertexCount < 3) {
	// 		vertexCount++;
	// 		var preVert = chunkStr.replace('vertex', '').match(/[-+]?[0-9]*\.?[0-9]+/g);
	// 		if (preVert != null) {
	// 			// console.log(vertexCount, preVert);
	// 			preVertHolder['vert'+vertexCount] = new Vertex(preVert[0],preVert[1],preVert[2]);
	// 		}
	// 	} else if (vertexCount >= 3) {
	// 		vertexCount = 0;
	// 		foundLoop = false;
	// 		foundFacet = false;
	// 		totalVol += _signedVolumeOfTriangle(preVertHolder);
	// 		c++;
	// 	}
	// });

	// stream.write(stl);
	// stream.end();

	var vertexes = stl.match(/facet\s+normal\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+outer\s+loop\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+endloop\s+endfacet/);
	var vert = vertexes[0].match(/vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s/g);

	// var 
	console.log(vert[0].replace('vertex', '').match(/[-+]?[0-9]*\.?[0-9]+/g));

	// var volumeTotal = Math.abs(totalVol)/1000;
	return {
		// volume: volumeTotal,
		// weight: volumeTotal * 1.04,
		// weight244: volumeTotal * 2.44,
		// count: c
	}
}

function NodeStl (stl) {
	this.rawStl = stl;

	this.stl = _parseSTLString(stl);
	console.log(this.stl);
}
NodeStl.prototype.getVolume = function () {
	var totalVolume = 0;

};

module.exports = NodeStl;
