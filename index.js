var fs = require('fs');

// 3d Vector x,y,z
Vector3 = function(x,y,z){
    this.x = x;
    this.y = y;
    this.z = z;
}

// Create a copy of the Vector
Vector3.prototype.clone = function(){
    return new Vector3(this.x, this.y, this.z);
}

// Add Vectors this and v
Vector3.prototype.add = function(v){
    this.x = this.x + v.x;
    this.y = this.y + v.y;
    this.z = this.z + v.z;
    return this;
}

// Subtract Vectors this and v
Vector3.prototype.sub = function(v){
    this.x = this.x - v.x;
    this.y = this.y - v.y;
    this.z = this.z - v.z;
    return this;
}

// Calculate the dot product of this and v.
//from https://www.cs.uaf.edu/2013/spring/cs493/lecture/01_24_vectors.html 
Vector3.prototype.dot = function(v){
    return this.x*v.x + this.y*v.y + this.z*v.z;;
}

// Calculate the cross of this and v.
//from https://www.cs.uaf.edu/2013/spring/cs493/lecture/01_24_vectors.html 
Vector3.prototype.cross = function(v){
    var x = this.x;
    var y = this.y;
    var z = this.z;
    
    this.x = y*v.z - z*v.y;
    this.y = z*v.x - x*v.z;
    this.z = x*v.y - y*v.x;
    
    return this;
}

// Calculate Vector length
Vector3.prototype.length = function(){
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
}

// Vector3 A, Vector3 B, Vector3 C
Triangle = function(a,b,c){
    this.vert1 = a;
    this.vert2 = b;
    this.vert3 = c;
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
function _triangleVolume (triangle) {
	var 
	v321 = Number(triangle.vert3.x * triangle.vert2.y * triangle.vert1.z),
	v231 = Number(triangle.vert2.x * triangle.vert3.y * triangle.vert1.z),
	v312 = Number(triangle.vert3.x * triangle.vert1.y * triangle.vert2.z),
	v132 = Number(triangle.vert1.x * triangle.vert3.y * triangle.vert2.z),
	v213 = Number(triangle.vert2.x * triangle.vert1.y * triangle.vert3.z),
	v123 = Number(triangle.vert1.x * triangle.vert2.y * triangle.vert3.z);
   
	return Number(1.0/6.0)*(-v321 + v231 + v312 - v132 - v213 + v123);
}

function _surfaceArea (triangles) {
    if (triangles.length === 0) return 0.0;
    //console.log("Finding Surface Area with "+triangles.length+" triangles.");
    var _area = 0.0;
    //iterate through faces
    for (var i = 0, len = triangles.length; i< len; i++) {
        var va = triangles[i].vert1;
        var vb = triangles[i].vert2;
        var vc = triangles[i].vert3;
        
        var ab = vb.clone().sub(va);
        var ac = vc.clone().sub(va);
        
        var cross = ab.clone().cross(ac);
        _area += cross.length()/2;        
    }
    console.log("Surface Area: "+_area);
    return _area;
}

function _boundingBox (triangles) {
  if (triangles.length === 0) return [0,0,0]
  
  var minx = Infinity,  maxx = -Infinity,  miny = Infinity,  maxy = -Infinity,  minz = Infinity,  maxz = -Infinity;
  var tminx = Infinity, tmaxx = -Infinity, tminy = Infinity, tmaxy = -Infinity, tminz = Infinity, tmaxz = -Infinity;

  triangles.forEach(function(triangle) {
    tminx = Math.min(triangle.vert1.x, triangle.vert2.x, triangle.vert3.x)
    minx  = tminx < minx ? tminx : minx
    tmaxx = Math.max(triangle.vert1.x, triangle.vert2.x, triangle.vert3.x)
    maxx  = tmaxx > maxx ? tmaxx : maxx


    tminy = Math.min(triangle.vert1.y, triangle.vert2.y, triangle.vert3.y)
    miny  = tminy < miny ? tminy : miny
    tmaxy = Math.max(triangle.vert1.y, triangle.vert2.y, triangle.vert3.y)
    maxy  = tmaxy > maxy ? tmaxy : maxy


    tminz = Math.min(triangle.vert1.z, triangle.vert2.z, triangle.vert3.z)
    minz  = tminz < minz ? tminz : minz
    tmaxz = Math.max(triangle.vert1.z, triangle.vert2.z, triangle.vert3.z)
    maxz  = tmaxz > maxz ? tmaxz : maxz
  });

  return [maxx - minx, maxy - miny, maxz - minz];
}

// parsing an STL ASCII string
function _parseSTLString (stl) {
	var totalVol = 0;
	// yes, this is the regular expression, matching the vertexes
	// it was kind of tricky but it is fast and does the job
	var vertexes = stl.match(/facet\s+normal\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+outer\s+loop\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+endloop\s+endfacet/g);

  var preTriangle;
  var verteces = Array(vertexes.length)
	vertexes.forEach(function (vert, i) {
		preTriangle = new Triangle();
		vert.match(/vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s/g).forEach(function (vertex, i) {
			var tempVector3	= vertex.replace('vertex', '').match(/[-+]?[0-9]*\.?[0-9]+/g);
			var preVector3	= new Vector3(tempVector3[0],tempVector3[1],tempVector3[2]);
			preTriangle['vert'+(i+1)] = preVector3;
		});
		var partVolume = _triangleVolume(preTriangle);
		totalVol += Number(partVolume);
		verteces[i] = preTriangle;
	});

	var volumeTotal = Math.abs(totalVol)/1000;
	return {
		volume: volumeTotal, 		    // cubic cm
		weight: volumeTotal * 1.04,	// gm
		boundingBox: _boundingBox(verteces),
		area: _surfaceArea(verteces),
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

  var verteces = Array(numTriangles)
	for (var i = 0; i < numTriangles; i++) {
		var 
		dv			= new DataView(buf, dataOffset + i*faceLength, faceLength),
		normal		= new Vector3(dv.getFloat32(0, le), dv.getFloat32(4, le), dv.getFloat32(8, le)),
		triangle	= new Triangle();
		for(var v = 3; v < 12; v+=3) {
			var vert = new Vector3(dv.getFloat32(v*4, le), dv.getFloat32((v+1)*4, le), dv.getFloat32( (v+2)*4, le ) );
			triangle['vert'+(v/3)] = vert;
		}
		totalVol += _triangleVolume(triangle);
		verteces[i] = triangle;
	}

	var volumeTotal = Math.abs(totalVol)/1000;
	return {
		volume: volumeTotal,		    // cubic cm
		weight: volumeTotal * 1.04,	// gm
		boundingBox: _boundingBox(verteces),
		area: _surfaceArea(verteces),
	}
}

// NodeStl
// =======
// > var stl = NodeStl(__dirname + '/myCool.stl');
// > console.log(stl.volume + 'cm^3');
// > console.log(stl.weight + 'gm');
function NodeStl (stlPath) {
	var buf;
	if(Object.prototype.toString.call(stlPath)=='[object String]')
		buf = fs.readFileSync(stlPath);
	else if(Object.prototype.toString.call(stlPath)=='[object Uint8Array]')
		buf=stlPath;
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
