import { Chiton } from "./Chiton";
import * as fs from 'fs';
import PriorityQueue from 'ts-priority-queue';

type Candidate = {
    chiton : Chiton;
    value : number;
}

type Coordinate = {
    x : number
    y : number
    sector : number[]
}

type Adjacencies = {
    n : Coordinate | undefined;
    e : Coordinate | undefined;
    s : Coordinate | undefined;
    w : Coordinate | undefined;
}


const visited = new Set<string>();
const NAVIGATE = [[-1, 0], [0, 1], [1, 0], [0, -1]]
let iterations : number = 0;
const customComparator = (a: Candidate, b: Candidate) => {
    return a.value - b.value;
}
const queue = new PriorityQueue<Candidate>({ comparator : customComparator})

// The number of times the grid is repeated in both directions (LIMIT = 1 for part 1)
const LIMIT = 5;


async function findPathsWithAStar() {
    const grid : string[][] = setup();
    const gridSize = Array.of(Number(grid.length), Number(grid[0].length));
    let node : Chiton = new Chiton([0, 0], 0, 0, null, [0, 0]);
    const start = performance.now()
    while (!stopCondition(node, gridSize)) {
        const candidates : Adjacencies = calculateAdjacencies(node, grid);
        Object.entries(candidates).forEach(([_, coords]) => {
            if (coords != undefined && !isVisited(coords)) {
                const value : number = getValue(coords, grid);
                const candidate = new Chiton(Array.of(coords.x, coords.y), value, 0, null, coords.sector)
                createPossibleAStarValues(candidate, node, gridSize)
            }
        });
        let x : Candidate = queue.dequeue();
        node = x.chiton;
        node.total = node.previous.total;
        iterations++;
    }
    const end = performance.now();
    console.log("Cost of cheapest path: ", node._total)
    console.log("Nodes expanded: ", iterations)
    console.log("Time elapsed: ", end - start)
}

function setup() : string[][] {
    iterations = 0;
    visited.clear();
    queue.clear();
    return loadGrid();
}

function loadGrid() : string[][] {
    const gridData : string[] = fs.readFileSync("path").toString('utf-8').split('\n'); // replace with path to data
    const gridArray : string[][] = gridData.map(x => x.split(''));
    return gridArray;
}

const getValue = (coords : Coordinate, grid : String[][]) : number => {
    const baseValue = Number(grid[coords.x][coords.y]);
    const offset : number = coords.sector[0] + coords.sector[1]
    if (offset + baseValue < 10) {
        return offset + baseValue
    }
    return (offset + baseValue) % 10 + 1
}

const stopCondition = (node : Chiton, gridSize : number[]) => {
        return (
            node.coords[0] === gridSize[0] - 1 &&
            node.coords[1] === gridSize[0] - 1 &&
            node.sector[0] === LIMIT - 1 &&
            node.sector[1] === LIMIT - 1
        );
    };

const isVisited = (testCoords : Coordinate) : boolean => {
    const testIdentifier = `${testCoords.x}-${testCoords.y}-${testCoords.sector[0]}-${testCoords.sector[1]}`;
    return visited.has(testIdentifier);
}

const createPossibleAStarValues = (candidate : Chiton, currentNode : Chiton, gridSize : number[]) : void => {
    const value : number = calculateHeuristic(candidate, gridSize) + currentNode.total;
    candidate.previous = currentNode;
    const c : Candidate = {
        chiton : candidate,
        value : value
    }
    const candidateIdentifier = `${candidate.coords[0]}-${candidate.coords[1]}-${candidate.sector[0]}-${candidate.sector[1]}`;
    if (!visited.has(candidateIdentifier)) {
        queue.queue(c);
        visited.add(candidateIdentifier);
    }
}


const calculateHeuristic = (candidate : Chiton, gridSize : number[]) => {
    const dx = gridSize[0] - candidate.coords[0] - 1;
    const dy = gridSize[0] - candidate.coords[1] - 1;
    const dSectorX = (LIMIT - 1 - candidate.sector[0]) * gridSize[0];
    const dSectorY = (LIMIT - 1 - candidate.sector[1]) * gridSize[1];
    return Math.abs(dx + dy + dSectorX + dSectorY + candidate.total);
}

const calculateAdjacencies = (node : Chiton, grid: String[][]) : Adjacencies => {
    const testCoord : number[] = [];
    let testSector : number[] = [];
    const adjacentCoords : Coordinate[] = [];
    const currentCoords : number[] = node.coords;
    const currentSector : number[] = node.sector;
    NAVIGATE.forEach(n => {
        testCoord[0] = currentCoords[0] + n[0]
        testCoord[1] = currentCoords[1] + n[1]
        testSector = [...currentSector];
        if ((testCoord[0] >= 0 && testCoord[0] <= grid.length - 1) && (testCoord[1] >= 0 && testCoord[1] <= grid.length - 1)) {
            testCoord[0] = currentCoords[0] + n[0]
            testCoord[1] = currentCoords[1] + n[1]
        }
        else if (testCoord[0] > grid.length - 1) {
            testSector[0] = currentSector[0] + 1
            testSector[1] = currentSector[1]
            testCoord[0] = currentCoords[0] + n[0] - grid.length
            testCoord[1] = currentCoords[1] + n[1]
        }
        else if (testCoord[0] < 0) {
            testSector[0] = currentSector[0] - 1
            testSector[1] = currentSector[1]
            testCoord[0] = currentCoords[0] + n[0] + grid.length
            testCoord[1] = currentCoords[1] + n[1]
        }
        else if (testCoord[1] > grid.length - 1) {
            testSector[0] = currentSector[0]
            testSector[1] = currentSector[1] + 1
            testCoord[0] = currentCoords[0] + n[0]
            testCoord[1] = currentCoords[1] + n[1] - grid.length
        }
        else if (testCoord[1] < 0) {
            testSector[0] = currentSector[0]
            testSector[1] = currentSector[1] - 1
            testCoord[0] = currentCoords[0] + n[0]
            testCoord[1] = currentCoords[1] + n[1] + grid.length
        }
        const coord : Coordinate = {
            x : testCoord[0],
            y : testCoord[1],
            sector : testSector
        }
        adjacentCoords.push(coord)
    });
    const a : Adjacencies = {
        n : adjacentCoords[0].sector.some(num => num < 0 || num >= LIMIT) ? undefined : adjacentCoords[0], 
        e : adjacentCoords[1].sector.some(num => num < 0 || num >= LIMIT) ? undefined : adjacentCoords[1], 
        s : adjacentCoords[2].sector.some(num => num < 0 || num >= LIMIT) ? undefined : adjacentCoords[2], 
        w : adjacentCoords[3].sector.some(num => num < 0 || num >= LIMIT) ? undefined : adjacentCoords[3] 
    }
    return a;
}

module.exports = { findPathsWithAStar }
