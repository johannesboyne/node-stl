var fs = require('fs');

// 3d Vector x,y,z
class Vector3 {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	// Create a copy of the Vector
	clone() {
		return new Vector3(this.x, this.y, this.z);
	}

	// Add Vectors this and v
	add(v) {
		this.x = this.x + v.x;
		this.y = this.y + v.y;
		this.z = this.z + v.z;
		return this;
	}

	// Subtract Vectors this and v
	sub(v) {
		this.x = this.x - v.x;
		this.y = this.y - v.y;
		this.z = this.z - v.z;
		return this;
	}

	// Calculate the dot product of this and v.
	// from https://www.cs.uaf.edu/2013/spring/cs493/lecture/01_24_vectors.html
	dot(v) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	// Calculate the cross of this and v.
	// from https://www.cs.uaf.edu/2013/spring/cs493/lecture/01_24_vectors.html
	cross(v) {
		const x = this.x;
		const y = this.y;
		const z = this.z;

		this.x = y * v.z - z * v.y;
		this.y = z * v.x - x * v.z;
		this.z = x * v.y - y * v.x;

		return this;
	}

	// Calculate Vector length
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
}

class STLMeasures {
  constructor() {
  	this.volume = 0;
  	this.area = 0;
  	this.minx = Infinity;
  	this.maxx = -Infinity;
  	this.miny = Infinity;
  	this.maxy = -Infinity;
  	this.minz = Infinity;
  	this.maxz = -Infinity;
  }

  addTriangle(triangle) {
 		this.volume += _triangleVolume(triangle);

		const ab = triangle[1].clone().sub(triangle[0]);
		const ac = triangle[2].clone().sub(triangle[0]);

		this.area +=
			ab
				.clone()
				.cross(ac)
				.length() / 2;

		const tminx = Math.min(triangle[0].x, triangle[1].x, triangle[2].x);
		this.minx = tminx < this.minx ? tminx : this.minx;
		const tmaxx = Math.max(triangle[0].x, triangle[1].x, triangle[2].x);
		this.maxx = tmaxx > this.maxx ? tmaxx : this.maxx;

		const tminy = Math.min(triangle[0].y, triangle[1].y, triangle[2].y);
		this.miny = tminy < this.miny ? tminy : this.miny;
		const tmaxy = Math.max(triangle[0].y, triangle[1].y, triangle[2].y);
		this.maxy = tmaxy > this.maxy ? tmaxy : this.maxy;

		const tminz = Math.min(triangle[0].z, triangle[1].z, triangle[2].z);
		this.minz = tminz < this.minz ? tminz : this.minz;
		const tmaxz = Math.max(triangle[0].z, triangle[1].z, triangle[2].z);
		this.maxz = tmaxz > this.maxz ? tmaxz : this.maxz;
  }

  finalize() {
  	const volumeTotal = Math.abs(this.volume) / 1000;
  	return {
  		volume: volumeTotal, // cubic cm
  		weight: volumeTotal * 1.04, // gm
  		boundingBox: [this.maxx - this.minx, this.maxy - this.miny, this.maxz - this.minz],
  		area: this.area
  	};
  }
}

// calculation of the triangle volume
// source: http://stackoverflow.com/questions/6518404/how-do-i-calculate-the-volume-of-an-object-stored-in-stl-files
function _triangleVolume(triangle) {
	const v321 = triangle[2].x * triangle[1].y * triangle[0].z,
		v231 = triangle[1].x * triangle[2].y * triangle[0].z,
		v312 = triangle[2].x * triangle[0].y * triangle[1].z,
		v132 = triangle[0].x * triangle[2].y * triangle[1].z,
		v213 = triangle[1].x * triangle[0].y * triangle[2].z,
		v123 = triangle[0].x * triangle[1].y * triangle[2].z;

	return 1.0 / 6.0 * (-v321 + v231 + v312 - v132 - v213 + v123);
}

// parsing an STL ASCII string
function parseSTLString(stl) {
	// yes, this is the regular expression, matching the vertexes
	// it was kind of tricky but it is fast and does the job
	let vertexes = stl.match(
		/facet\s+normal\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+outer\s+loop\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+endloop\s+endfacet/g
	);

  let measures = new STLMeasures();

	vertexes.forEach(function(vert) {
		const triangle = new Array(3);
		vert
			.match(
				/vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s/g
			)
			.forEach(function(vertex, i) {
				let vector = vertex
					.replace('vertex', '')
					.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);

				triangle[i] = new Vector3(vector[0], vector[1], vector[2]);
			});

      measures.addTriangle(triangle);
	});

  return measures.finalize();
}

// parsing an STL Binary File
// (borrowed some code from here: https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js)
const parseSTLBinary = function(buffer) {
	const faces = buffer.readUInt32LE(80);
	const dataOffset = 84;
	const faceLength = 12 * 4 + 2;

  let measures = new STLMeasures();

	for (let face = 0; face < faces; face++) {
		const start = dataOffset + face * faceLength;

		let triangle = new Array(3);

		for (let i = 1; i <= 3; i++) {
			const vertexstart = start + i * 12;

			triangle[i - 1] = new Vector3(
				buffer.readFloatLE(vertexstart, true),
				buffer.readFloatLE(vertexstart + 4, true),
				buffer.readFloatLE(vertexstart + 8, true)
			);
		}

    measures.addTriangle(triangle);
	}

  return measures.finalize();
};

// check if stl is binary vs ASCII
// (borrowed some code from here: https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js)
const isBinary = function(buffer) {
	let header_size = 84;

	if (buffer.length <= header_size) {
		return false; // an empty binary STL must be at least 84 bytes
	}

	let expected_size, face_size, n_faces;
	face_size = 50;
	n_faces = buffer.readUInt32LE(80);

	// An ASCII STL data must begin with 'solid ' as the first six bytes.
	// However, ASCII STLs lacking the SPACE after the 'd' are known to be
	// plentiful. There are also many binary STL that start with solid
	// regardless of this standard, so we check if offset 80, the location of
	// the number of triangles in a binary STL matches the expected file size.

	expected_size = header_size + n_faces * face_size;
	return buffer.length === expected_size;
};

// NodeStl
// =======
// > var stl = NodeStl(__dirname + '/myCool.stl');
// > console.log(stl.volume + 'cm^3');
// > console.log(stl.weight + 'gm');
function NodeStl(path) {
	if (Object.prototype.toString.call(path) == '[object String]') {
		buffer = fs.readFileSync(path);
	} else {
		buffer = path;
	}

	return isBinary(buffer)
		? parseSTLBinary(buffer)
		: parseSTLString(buffer.toString());
}

module.exports = NodeStl;
