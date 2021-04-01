const Map = require("../../../entities/map");
const stateAttrs = require("../../../entities/state/attributes");
const {EventEmitter} = require("events");
const MockLayer = require("./MockLayer");

class MockMap {
    /**
     * @param {import("../../../core/ValetudoRobot")|any} robot
     * @param {number} width
     * @param {number} height
     * @param {number} pixelSize
     * @param {number} mapSize
     * @param {boolean} generateFloor
     */
    constructor(robot, width, height, pixelSize = 5, mapSize = 5120, generateFloor = true) {
        this.robot = robot;

        this.width = width;
        this.height = height;
        this.pixelSize = pixelSize;
        this.mapSize = mapSize;
        this.generateFloor = generateFloor;

        this.eventEmitter = new EventEmitter();

        this.walls = new MockLayer(Map.MapLayer.TYPE.WALL);
        this.floor = new MockLayer(Map.MapLayer.TYPE.FLOOR);
        this.segments = {};

        this.layers = [];
        this.entities = [];

        this.chargerLocation = [5 * this.pixelSize, 3 * this.pixelSize];
        this.robotPosition = [5 * this.pixelSize, 6 * this.pixelSize];
        this.robotAngle = 0;
        this.robotPath = [];

        this.robotState = stateAttrs.StatusStateAttribute.VALUE.DOCKED;

        this.addHorizontalWall(0, 0, this.width + 2);
        this.addHorizontalWall(0, this.height + 2, this.width + 2);
        this.addVerticalWall(0, 1, this.height);
        this.addVerticalWall(this.width + 2, 1, this.height);
        this.addFloor(1, 1, this.width, this.height, 0);

        // Since the layers don't change too often we only generate them when necessary
        this.generateLayers();

        setInterval(() => {
            const statusStateAttribute = this.robot.state.getFirstMatchingAttribute({
                attributeClass: stateAttrs.StatusStateAttribute.name
            });

            // if (statusStateAttribute.value === stateAttrs.StatusStateAttribute.VALUE.CLEANING) {
            //     this.robotStep(20);
            //     if (this.robotPosition[1] >= 970) {
            //         this.robotAngle = 0;
            //         this.robotPosition[0] += 20;
            //         this.robotPosition[1] = 1000;
            //     } else if (this.robotPosition[1] <= 530) {
            //         this.robotAngle = 180;
            //         this.robotPosition[0] += 20;
            //         this.robotPosition[1] = 500;
            //     }
            // }

            this.eventEmitter.emit("MapUpdated");
            this.robotState = statusStateAttribute.value;
        }, 1000);
    }

    onMapUpdate(listener) {
        this.eventEmitter.on("MapUpdated", listener);
    }

    robotStep(distance) {
        const angle = (this.robotAngle - 90.0) * Math.PI / 180.0;
        const dx = distance * Math.cos(angle);
        const dy = distance * Math.sin(angle);
        this.robotPosition[0] += dx;
        this.robotPosition[1] += dy;
        this.robotPath.push(this.robotPosition[0]);
        this.robotPath.push(this.robotPosition[1]);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} length
     */
    addHorizontalWall(x, y, length) {
        for (let i = 0; i <= length; i++) {
            this.walls.addPixel(x + i, y);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} length
     */
    addVerticalWall(x, y, length) {
        for (let i = 0; i <= length; i++) {
            this.walls.addPixel(x, y + i);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} segmentId
     */
    addFloor(x, y, w, h, segmentId) {
        if (!this.segments[segmentId]) {
            this.segments[segmentId] = new MockLayer(Map.MapLayer.TYPE.SEGMENT, segmentId);
        }
        for (let ix = 0; ix <= w; ix++) {
            for (let iy = 0; iy <= h; iy++) {
                this.floor.addPixel(x + ix, y + iy);
                this.segments[segmentId].addPixel(x + ix, y + iy);
            }
        }
    }

    getMap() {
        return new Map.ValetudoMap({
            size: {
                x: this.mapSize,
                y: this.mapSize
            },
            pixelSize: this.pixelSize,
            layers: this.layers,
            entities: [
                new Map.PointMapEntity({
                    type: Map.PointMapEntity.TYPE.CHARGER_LOCATION,
                    points: this.chargerLocation
                }),
                new Map.PointMapEntity({
                    type: Map.PointMapEntity.TYPE.ROBOT_POSITION,
                    points: this.robotPosition,
                    metaData: {
                        angle: this.robotAngle
                    }
                }),
                new Map.PathMapEntity({
                    type: Map.PathMapEntity.TYPE.PATH,
                    points: this.robotPath
                }),
            ]
        });
    }

    generateLayers() {
        this.layers = [this.walls.getMapLayer()]
            .concat(Object.keys(this.segments)
                .map(k => this.segments[k].getMapLayer()));

        if (this.generateFloor) {
            this.layers.push(this.floor.getMapLayer());
        }
    }
}

module.exports = MockMap;
