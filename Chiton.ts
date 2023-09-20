class Chiton {
    coords: Array<number>;
    value: number;
    _total: number;
    previous: Chiton
    sector : Array<number>

    constructor(coords: Array<number>, value : number, total : number, previous : Chiton, sector: Array<number>) {
        this.coords = coords;
        this.value = value;
        this.total = total;
        this.previous = previous;
        this.sector = sector;
    }

    get total() {
        return this._total;
    }

    set total(total: number) {
        this._total = total + this.value;
    }
}

export { Chiton };
