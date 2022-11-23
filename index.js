const Vector3 = require("./lib/vector3");

/**
 * Measure properties of STLs
 */
class STLMeasures {
  /**
   * @param {number} density - density of material in cm^3
   */
  constructor(density) {
    this.density = density;
    this.volume = 0;
    this.area = 0;
    this.minx = Infinity;
    this.maxx = -Infinity;
    this.miny = Infinity;
    this.maxy = -Infinity;
    this.minz = Infinity;
    this.maxz = -Infinity;
    this.xCenter = 0;
    this.yCenter = 0;
    this.zCenter = 0;
    this.edges = [];
  }
  /**
   * calculation of the triangle volume
   * source: http://stackoverflow.com/questions/6518404/how-do-i-calculate-the-volume-of-an-object-stored-in-stl-files
   * @param triangle
   * @returns {number}
   * @private
   */
  static _triangleVolume(triangle) {
    const v321 = triangle[2].x * triangle[1].y * triangle[0].z,
      v231 = triangle[1].x * triangle[2].y * triangle[0].z,
      v312 = triangle[2].x * triangle[0].y * triangle[1].z,
      v132 = triangle[0].x * triangle[2].y * triangle[1].z,
      v213 = triangle[1].x * triangle[0].y * triangle[2].z,
      v123 = triangle[0].x * triangle[1].y * triangle[2].z;

    return (1.0 / 6.0) * (-v321 + v231 + v312 - v132 - v213 + v123);
  }

  /**
   * add triangle
   * @param triangle
   */
  addTriangle(triangle) {
    let currentVolume = this.constructor._triangleVolume(triangle);
    this.volume += currentVolume;

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

    // Center of Mass calculation
    // adapted from c++ at: https://stackoverflow.com/a/2085502/6482703
    this.xCenter +=
      ((triangle[0].x + triangle[1].x + triangle[2].x) / 4) * currentVolume;
    this.yCenter +=
      ((triangle[0].y + triangle[1].y + triangle[2].y) / 4) * currentVolume;
    this.zCenter +=
      ((triangle[0].z + triangle[1].z + triangle[2].z) / 4) * currentVolume;
    
    // edge array
    // edge: {v: [] - vector coordinates, p: int - pair edge index}
    this.edges.push({v: [triangle[0].x, triangle[0].y, triangle[0].z, triangle[1].x, triangle[1].y, triangle[1].z], p: undefined}, 
      {v: [triangle[1].x, triangle[1].y, triangle[1].z, triangle[2].x, triangle[2].y, triangle[2].z], p: undefined},
      {v: [triangle[2].x, triangle[2].y, triangle[2].z, triangle[0].x, triangle[0].y, triangle[0].z], p: undefined});
  }

  /**
   * calculates final measurements
   * @returns {{volume: number, weight: number, boundingBox: number[], area: number, centerOfMass: number[], isWatertight: boolean}}
   */
  finalize() {
    const volumeTotal = Math.abs(this.volume) / 1000;

    this.xCenter /= this.volume;
    this.yCenter /= this.volume;
    this.zCenter /= this.volume;

    return {
      volume: volumeTotal, // cubic cm
      weight: volumeTotal * this.density, // gm
      boundingBox: [
        this.maxx - this.minx,
        this.maxy - this.miny,
        this.maxz - this.minz
      ],
      area: this.area,
      centerOfMass: [this.xCenter, this.yCenter, this.zCenter],
      isWatertight: this._isWatertight()
    };
  }

  /**
   * searches non-manifold edges (duplicate and unpaired/single edges) and determines whether STL is one closed mesh or not.
   * first sorts all triangles' edges according to their coordinates and uses binary search to find duplicate and unpaired edges, 
   * if encounters one returns false otherwise true.
   * @returns {boolean} - true: STL is watertight, false: STL is not watertight
   */
  _isWatertight() {
    // sorted edge array will be used in binary search in order to find duplicate and unpaired edges
    this.edges.sort(this.constructor._compareEdges);
    
    // duplicate edge search 
    let previousEdge = this.edges[0];
    for(let i = 1; i < this.edges.length; i++) {
      const edge = this.edges[i];
      if (this.constructor._compareEdges(previousEdge, edge) == 0) {
        return false;
      }
      previousEdge = edge;
    }

    // pair edge search
    for (let edgeIndex = 0; edgeIndex < this.edges.length; edgeIndex++) {
      const edge = this.edges[edgeIndex];
      if (edge.p == undefined) {
        const pairEdge = {v: [edge.v[3], edge.v[4], edge.v[5], edge.v[0], edge.v[1], edge.v[2]], p: undefined};
        
        const pairEdgeIndex = this.constructor._binaryPairSearch(this.constructor._compareEdges, this.edges, pairEdge, edgeIndex + 1)

        if (pairEdgeIndex != -1) { // pair found
          edge.p = pairEdgeIndex;
          this.edges[pairEdgeIndex].p = edgeIndex;
        } else { // pair not found
          return false;
        }
      }
    }

    return true;
  }

  /**
   * searches given edge (pair edge) in the remaining sorted edge array
   * returns -1 if pair is not found, index of the pair edge if it's found 
   * @param {function} comparator - edge compare function
   * @param {[]} sortedEdges - sorted edge array
   * @param {{}} edge - edge: {v: [] - vector coordinates, p: int - pair edge index}
   * @param {int} - start index for searching in sorted edge array
   * @returns {int} - pair not found: -1, pair found: index of the pair edge
   */
  static _binaryPairSearch(comparator, sortedEdges, edge, start){
    let end = sortedEdges.length - 1;

    while (start <= end) {
      let middle = Math.floor((start + end) / 2);

      if (comparator(sortedEdges[middle], edge) == 0) {
        // pair edge found
        return middle;
      } else if (comparator(sortedEdges[middle], edge) < 0) {
        // continue searching to the right
        start = middle + 1;
      } else {
        // continue searching to the left
        end = middle - 1;
      }
    }
	  // pair edge wasn't found
    return -1;
  }

  /**
   * compares two edges
   * @param {{}} a - edge: {v: [] - vector coordinates, p: int - pair edge index}
   * @param {{}} b - edge: {v: [] - vector coordinates, p: int - pair edge index}
   * @returns {int}
   */
  static _compareEdges(a, b) {
    if (a.v[0] == b.v[0]) {
      if (a.v[1] == b.v[1]) {
        if (a.v[2] == b.v[2]) {
          if (a.v[3] == b.v[3]) {
            if (a.v[4] == b.v[4]) {
              return a.v[5] - b.v[5];
            } else {
              return a.v[4] - b.v[4];
            }
          } else {
            return a.v[3] - b.v[3];
          }
        } else {
          return a.v[2] - b.v[2];
        }
      } else {
        return a.v[1] - b.v[1];
      }
    } else {
      return a.v[0] - b.v[0];
    }
  }
}

/**
 * NodeStl
 * =======
 * > const stl = NodeStl(__dirname + '/myCool.stl');
 * > console.log(stl.volume + 'cm^3');
 * > console.log(stl.weight + 'gm');
 */
class NodeStl {
  /**
   * @param {string|buffer} path
   * @param {object} config
   */
  constructor(path, config = { density: 1.04 }) {
    let buffer;

    if (Object.prototype.toString.call(path) === "[object String]") {
      const fs = require("fs"); // moved this as a step toward browser compatibility

      buffer = fs.readFileSync(path);
    } else {
      buffer = path;
    }

    this._parse(buffer, config);
  }

  /**
   * check if stl is binary vs ASCII
   * (borrowed some code from here: https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js)
   * @param {buffer} buffer
   * @returns {boolean}
   */
  static _isBinary(buffer) {
    const MAX_ASCII_CHAR_CODE = 127;
    const HEADER_SIZE = 84;
    const str = buffer.toString()

    if (buffer.length <= HEADER_SIZE) {
      return false; // an empty binary STL must be at least 84 bytes
    }

    for (var i = 0, strLen = str.length; i < strLen; ++i) {
      if (str.charCodeAt(i) > MAX_ASCII_CHAR_CODE) {
        return true;
      }
    }

    let expected_size, face_size, n_faces;
    face_size = 50;
    n_faces = buffer.readUInt32LE(80);

    // An ASCII STL data must begin with 'solid ' as the first six bytes.
    // However, ASCII STLs lacking the SPACE after the 'd' are known to be
    // plentiful. There are also many binary STL that start with solid
    // regardless of this standard, so we check if offset 80, the location of
    // the number of triangles in a binary STL matches the expected file size.

    expected_size = HEADER_SIZE + n_faces * face_size;
    return buffer.length === expected_size;
  }

  /**
   * parse buffer and assign measurements
   * @param {buffer} buffer
   * @param {object} config
   */
  _parse(buffer, config) {
    let measures;
    if (this.constructor._isBinary(buffer)) {
      measures = this.constructor._parseSTLBinary(buffer, config.density);
    } else {
      measures = this.constructor._parseSTLString(
        buffer.toString(),
        config.density
      );
    }

    Object.assign(this, measures);
  }

  /**
   * parses an STL ASCII string
   * @param {string} stl
   * @param {number} density - density of material in cm^3
   * @returns {{volume: number, weight: number, boundingBox: number[], area: number, centerOfMass: number[]}}
   }
   */
  static _parseSTLString(stl, density) {
    // yes, this is the regular expression, matching the vertexes
    // it was kind of tricky but it is fast and does the job
    let vertexes = stl.match(
      /facet\s+normal\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+outer\s+loop\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+endloop\s+endfacet/g
    );

    let measures = new STLMeasures(density);

    vertexes.forEach(function(vert) {
      const triangle = new Array(3);
      vert
        .match(
          /vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s/g
        )
        .forEach(function(vertex, i) {
          let vector = vertex
            .replace("vertex", "")
            .match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);

          triangle[i] = new Vector3(vector[0], vector[1], vector[2]);
        });

      measures.addTriangle(triangle);
    });

    return measures.finalize();
  }

  /**
   * parsing an STL Binary File
   * (borrowed some code from here: https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js)
   * @param {buffer} buffer
   * @param {number} density - density of material in cm^3
   * @returns {{volume: number, weight: number, boundingBox: number[], area: number, centerOfMass: number[]}}

   */
  static _parseSTLBinary(buffer, density) {
    const faces = buffer.readUInt32LE(80);
    const dataOffset = 84;
    const faceLength = 12 * 4 + 2;

    let measures = new STLMeasures(density);

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
  }
}

module.exports = NodeStl;