node-stl
========

Parse *STL* files with Node.js and get volume, weight, and the bounding box.

## example

```javascript
var stl = NodeStl(__dirname + '/myCool.stl');
console.log(stl.volume + 'cm^3');     // 21cm^3
console.log(stl.weight + 'gm');       //  1gm
console.log(stl.boundingBox,'(mm)');  // [60,45,50] (mm)
console.log(stl.area,'(m)');          // 91.26 (m)
```
node-stl recognizes by itself whether it is dealing with an ASCII STL or a binary STL file

## load file from url

Use `request` to load a file from url

```javascript
var request=require('request');
var requestSettings = {
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

`0.3.0`

## contributors

- [alexjv89](https://github.com/alexjv89)
- [redwildfire13](https://github.com/redwildfire13)
