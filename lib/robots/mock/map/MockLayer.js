const MapLayer = require("../../../entities/map/MapLayer");

class MockLayer {
    /**
     * @param {MapLayer.TYPE} type
     * @param {number|null} segmentId
     * @param {string} name
     */
    constructor(type, segmentId = null, name = "") {
        this.segmentId = segmentId;
        this.type = type;
        this.name = name;
        this.pixels = [];
        this.active = false;

        this.resetBounds();
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    addPixel(x, y) {
        this.pixels.push([x, y]);
    }

    /**
     * @param {boolean} active
     */
    setActive(active) {
        this.active = active;
    }

    resetBounds() {
        this.xBounds = [Infinity, 0];
        this.yBounds = [Infinity, 0];
    }

    calculatePath() {
        this.resetBounds();

        const localYBounds = {};

        this.pixels.forEach(([x, y]) => {
            this.xBounds = [Math.min(x, this.xBounds[0]), Math.max(x, this.xBounds[1])];
            this.yBounds = [Math.min(y, this.yBounds[0]), Math.max(y, this.yBounds[1])];

            localYBounds[y] = [];
        });
    }

    getMapLayer() {
        const metaData = {};
        if (this.segmentId !== null) {
            metaData.segmentId = this.segmentId;
            metaData.active = this.active;
        }

        return new MapLayer({
            pixels: this.pixels.reduce((p, c) => p.concat(c), []),
            type: this.type,
            metaData
        });
    }
}

module.exports = MockLayer;
