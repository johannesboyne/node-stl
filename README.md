node-stl
========

[![CircleCI](https://circleci.com/gh/johannesboyne/node-stl.svg?style=svg)](https://circleci.com/gh/johannesboyne/node-stl)

Parse *STL* files with Node.js and get volume, weight, the bounding box, the center of mass and whether it is watertight or not.

## example

```javascript
const NodeStl = require("node-stl");

var stl = new NodeStl(__dirname + '/myCool.stl', {density: 1.04});
console.log(stl.volume + 'cm^3');     // 21cm^3
console.log(stl.weight + 'gm');       //  1gm
console.log(stl.boundingBox,'(mm)');  // [60,45,50] (mm)
console.log(stl.area,'(m)');          // 91.26 (m)
console.log(stl.centerOfMass,'(mm)'); // [30,22.5,25] (mm)
console.log(stl.isWatertight ? 'STL is watertight' : 'STL is not watertight');
```
node-stl recognizes by itself whether it is dealing with an ASCII STL or a binary STL file

## load file from url

Use `request` to load a file from url

```javascript
const NodeStl = require("node-stl");
const request = require('request');

const requestSettings = {
   method: 'GET',
   url: 'https://s3.amazonaws.com/minifactory-stl/WALLY_1plate.stl',
   encoding: null,
};

request(requestSettings, function(error, response, body) {
    var stl = new NodeStl(body);
    assert.equal(stl.volume, 21.87511539650792);
    done(null);
});
```

## install

use [npm/node-stl](https://www.npmjs.com/package/node-stl):

```shell
$ npm install node-stl
```

## license

MIT

## version

`0.7.1`

## contributors

- [alexjv89](https://github.com/alexjv89)
- [redwildfire13](https://github.com/redwildfire13)
- [lexe11](https://github.com/lexe11)
- [Renari](https://github.com/Renari)
- [jacekkopecky](https://github.com/jacekkopecky)
- [grmmph](https://github.com/grmmph)
- [gokhangulgezen](https://github.com/gokhangulgezen)
