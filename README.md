node-stl
========

parse stl files with Node.js and get volume, and weight

## example

```javascript
var stl = NodeStl(__dirname + '/myCool.stl');
console.log(stl.volume + 'cm^3');
console.log(stl.weight + 'gm');
```
node-stl recognizes by itself whether it is dealing with an ASCII STL or a binary STL file

## install

use [npm](https://npmjs.org):

```shell
$ npm install node-stl
```

## license

MIT

## Version

`0.0.1`