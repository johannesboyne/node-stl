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
  }

  /**
   * calculates final measurements
   * @returns {{volume: number, weight: number, boundingBox: number[], area: number, centerOfMass: number[]}}
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
      centerOfMass: [this.xCenter, this.yCenter, this.zCenter]
    };
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
