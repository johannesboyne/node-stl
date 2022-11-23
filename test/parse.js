const assert = require("assert"),
  NodeStl = require("../");
request = require("request");

describe("should load an STL and measure volume, weight, and area", function() {
  it("load an ascii file", function() {
    // source for this stl: http://www.thingiverse.com/thing:47956
    let a = new NodeStl(__dirname + "/test_data/WALLY_1plate.stl");
    assert.equal(a.volume, 22.86382329248822);
  });
  it("load a binary file", function() {
    // source for this stl: http://www.thingiverse.com/thing:61532
    let b = new NodeStl(__dirname + "/test_data/RasPiCaseLight.stl");
    assert.equal(b.volume, 1.0919298479039214);
  });
  it("loads the petosaurs with the right dimensions", function() {
    // source for this stl: http://www.thingiverse.com/thing:1607628
    let c = new NodeStl(__dirname + "/test_data/Pterosaur_FDM.stl");
    assert.deepEqual(
      c.boundingBox.map(function(bbe) {
        return Math.round(bbe);
      }),
      [60, 45, 50]
    );
    assert.equal(c.isWatertight, false);
  });
  it("loads the box_2x3x4 with area of 52 and volume of 24", function() {
    // source for this stl: http://www.thingiverse.com/thing:1607628
    let d = new NodeStl(__dirname + "/test_data/box_2x3x4.stl");
    assert.equal(d.area, 52);
    assert.equal(d.volume * 1000, 24);
    assert.deepEqual(d.centerOfMass, [0, 0, 0]);
  });
  it("loads the box_3x3x3_offset with area of 54 and volume of 27", function() {
    let d = new NodeStl(__dirname + "/test_data/box_3x3x3_offset.stl");
    assert.equal(d.area, 54);
    // toPrecision because the calculation is off due to JS accuracy issues
    assert.equal(d.volume.toPrecision(6), 0.027);
    assert.deepEqual(
      d.centerOfMass.map(function(x) {
        return Number(x.toPrecision(6));
      }),
      [1.50001, 1.5, 1.5]
    );
    assert.equal(d.isWatertight, true);
  });
  it("loads a binary file that starts with solid", function() {
    // source for this stl: http://www.thingiverse.com/thing:2462372
    let e = new NodeStl(__dirname + "/test_data/002.STL");
    assert.equal(e.volume, 48.6251007777451);
  });
  it("loads a file buffer", function() {
    let fs = require("fs");
    let file_buf = fs.readFileSync(__dirname + "/test_data/WALLY_1plate.stl");
    let a = new NodeStl(file_buf);
    assert.equal(a.volume, 22.86382329248822);
  });
  it("loads a file from url", function(done) {
    let requestSettings = {
      method: "GET",
      url: "https://s3.amazonaws.com/minifactory-stl/WALLY_1plate.stl",
      encoding: null
    };
    request(requestSettings, function(error, response, file) {
      let a = new NodeStl(file);
      assert.equal(a.volume, 22.86382329248822);
      done(null);
    });
  }).timeout("5000");

  it("use custom density", function() {
    // source for this stl: http://www.thingiverse.com/thing:61532

    let config = { density: 1.25 };

    let b = new NodeStl(__dirname + "/test_data/RasPiCaseLight.stl", config);
    assert.equal(b.weight, 1.3649123098799019);
  });

  it("works with box.stl binary", function() {
    // source for this stl: http://www.thingiverse.com/thing:61532
    let b = new NodeStl(__dirname + "/test_data/box.stl");
    assert.equal(b.weight, 145.60593212682824);
  });
});