export = NodeStl;

interface parsedSTL {
    volume: number,
    weight: number,
    boundingBox: number[],
    area: number,
    centerOfMass: number[],
}

declare class NodeStl implements parsedSTL {
    public volume: number;
    public weight: number;
    public boundingBox: number[];
    public area: number;
    public centerOfMass: number[];

    constructor(model: string|Buffer, config?: Object);

    _isBinary(buffer: Buffer): boolean;
    _parseSTLString(stl: string, density: number): parsedSTL;
    _parseSTLBinary(stl: Buffer, density: number): parsedSTL;
}
