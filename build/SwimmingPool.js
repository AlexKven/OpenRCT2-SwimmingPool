"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ObjectHelper = function () {
    function ObjectHelper() {
        _classCallCheck(this, ObjectHelper);
    }

    _createClass(ObjectHelper, [{
        key: "GetObjectIndex",
        value: function GetObjectIndex(type, identifier) {
            var list = context.getAllObjects(type);
            for (var i = 0; i < list.length; i++) {
                var obj = list[i];
                if (obj.identifier.trim() === identifier) {
                    return obj.index;
                }
            }
        }
    }, {
        key: "GetAllPaths",
        value: function GetAllPaths() {
            if (this.paths) return this.paths;
            this.paths = context.getAllObjects("footpath");
            return this.GetAllPaths();
        }
    }]);

    return ObjectHelper;
}();

var TileHelper = function () {
    function TileHelper() {
        _classCallCheck(this, TileHelper);
    }

    _createClass(TileHelper, null, [{
        key: "ManuallyCalculatePathEdges",

        // 'pAB' = X above, Y below
        // 'pB0' = X below, Y same, etc.
        value: function ManuallyCalculatePathEdges(pB0, pA0, p0B, p0A, pBA, pAA, pAB, pBB) {
            var result = 0;
            if (pB0) result += 1;
            if (pA0) result += 4;
            if (p0A) result += 2;
            if (p0B) result += 8;
            if (pBA && pB0 && p0A) result += 16;
            if (pAA && pA0 && p0A) result += 32;
            if (pAB && pA0 && p0B) result += 64;
            if (pBB && pB0 && p0B) result += 128;
            return result;
        }
    }, {
        key: "CalculatePathEdges",
        value: function CalculatePathEdges(regionInfo) {
            var xAbove = regionInfo.x < regionInfo.right;
            var xBelow = regionInfo.x > regionInfo.left;
            var yAbove = regionInfo.y < regionInfo.top;
            var yBelow = regionInfo.y > regionInfo.bottom;
            return this.ManuallyCalculatePathEdges(xBelow, xAbove, yBelow, yAbove, xBelow && yAbove, xAbove && yAbove, xAbove && yBelow, xBelow && yBelow);
        }
    }, {
        key: "AnalyzeTile",
        value: function AnalyzeTile(tile) {
            var result = {
                hasSurface: false,
                footpaths: [],
                tracks: [],
                smallSceneries: [],
                walls: [],
                entrances: [],
                largeSceneries: [],
                banners: [] };
            for (var i = 0; i < tile.numElements; i++) {
                var element = tile.getElement(i);
                element.tileIndex = i;

                switch (element.type) {
                    case "surface":
                        result.hasSurface = true;
                        result.landHeight = element.baseHeight;
                        result.waterHeight = element.waterHeight / 8;
                        result.hasOwnership = element.hasOwnership;
                        result.slope = element.slope;
                        result.surfaceIndex = i;
                        result.surface = element;
                        break;
                    case "footpath":
                        result.footpaths.push(element);
                        break;
                    case "track":
                        result.tracks.push(element);
                        break;
                    case "small_scenery":
                        result.smallSceneries.push(element);
                        break;
                    case "wall":
                        result.walls.push(element);
                        break;
                    case "entrance":
                        result.entrances.push(element);
                        break;
                    case "large_scenery":
                        result.largeSceneries.push(element);
                        break;
                    case "banner":
                        result.banners.push(element);
                        break;
                }
            }
            return result;
        }
    }, {
        key: "ConnectFootpathsBeyondEdge",
        value: function ConnectFootpathsBeyondEdge(regionInfo, footpathElement) {}
    }, {
        key: "InsertNewFootpathElement",
        value: function InsertNewFootpathElement(tile, index, desc) {
            var footpathElement = tile.insertElement(index);

            try {
                footpathElement.type = "footpath";
                footpathElement.clearanceHeight = desc.baseHeight + 4;
                // footpathElement.slopeDirection = null;
                // footpathElement.isBlockedByVehicle = false;
                // footpathElement.isWide = false;
                // footpathElement.isQueue = false;
                // footpathElement.queueBannerDirection = null;
                // footpathElement.addition = null;

                // Specified properties
                footpathElement.baseHeight = desc.baseHeight;
                footpathElement.edgesAndCorners = desc.edgesAndCorners;

                var data = tile.data;
                var baseIndex = 16 * index;
                data[baseIndex + 4] = desc.footpathType;
                tile.data = data;
            } catch (ex) {
                ui.showError("exception:", "" + ex);
            }
        }
    }, {
        key: "PreClearArea",
        value: function PreClearArea(analysis, minClearance, maxClearance) {
            var cost = 0;
            var indicesToRemove = [];

            var element = void 0;
            var object = void 0;
            for (var i = 0; i < analysis.footpaths.length; i++) {
                element = analysis.footpaths[i];
                if (element.baseHeight >= minClearance && element.baseHeight <= maxClearance) {
                    indicesToRemove.push(element.tileIndex);
                    cost -= 100;
                }
            }
            for (var _i = 0; _i < analysis.tracks.length; _i++) {
                element = analysis.tracks[_i];
                if (element.baseHeight >= minClearance && element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Track in the way");
                    return { success: false, cost: null, indicesToRemove: null };
                }
            }
            for (var _i2 = 0; _i2 < analysis.smallSceneries.length; _i2++) {
                element = analysis.smallSceneries[_i2];
                if (element.baseHeight >= minClearance && element.baseHeight <= maxClearance) {
                    indicesToRemove.push(element.tileIndex);
                    object = context.getObject("small_scenery", element.object);
                    cost += object.removalPrice * 10;
                }
            }
            for (var _i3 = 0; _i3 < analysis.walls.length; _i3++) {
                element = analysis.walls[_i3];
                if (element.baseHeight >= minClearance && element.baseHeight <= maxClearance) {
                    indicesToRemove.push(element.tileIndex);
                }
            }
            for (var _i4 = 0; _i4 < analysis.entrances.length; _i4++) {
                element = analysis.entrances[_i4];
                if (element.baseHeight >= minClearance && element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Entrance or exit in the way");
                    return { success: false, cost: null, indicesToRemove: null };
                }
            }
            for (var _i5 = 0; _i5 < analysis.largeSceneries.length; _i5++) {
                element = analysis.largeSceneries[_i5];
                if (element.baseHeight >= minClearance && element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Large scenery in the way");
                    return { success: false, cost: null, indicesToRemove: null };
                }
            }
            for (var _i6 = 0; _i6 < analysis.banners.length; _i6++) {
                element = analysis.banners[_i6];
                if (element.baseHeight >= minClearance && element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Banner in the way");
                    return { success: false, cost: null, indicesToRemove: null };
                }
            }

            return { success: true, cost: cost, indicesToRemove: indicesToRemove };
        }
    }, {
        key: "PreConstructDeck",
        value: function PreConstructDeck(tile, analysis, regionInfo, objectsInfo) {
            var cost = 0;

            var minClearance = analysis.landHeight;
            var maxClearance = analysis.landHeight + 4;
            if (analysis.waterHeight > 0) {
                maxClearance += 4;
                cost += 400;
            }
            if (objectsInfo.footpathObject != null) cost += 120;

            // Preclear
            var result = this.PreClearArea(analysis, minClearance, maxClearance);
            if (!result.success) return { success: false };else {
                result.tile = tile;
                result.analysis = analysis;
                result.regionInfo = regionInfo;
                result.objectsInfo = objectsInfo;
                result.minClearance = minClearance;
                result.maxClearance = maxClearance;
                result.cost += cost;
                return result;
            }
        }
    }, {
        key: "ConstructDeck",
        value: function ConstructDeck(preconstruction) {
            var tile = preconstruction.tile;
            var analysis = preconstruction.analysis;
            var regionInfo = preconstruction.regionInfo;
            var objectsInfo = preconstruction.objectsInfo;
            var cost = preconstruction.cost;
            var indicesToRemove = preconstruction.indicesToRemove;

            if (indicesToRemove.length > 0) {
                indicesToRemove.sort();
                for (var i = indicesToRemove.length - 1; i >= 0; i--) {
                    tile.removeElement(indicesToRemove[i]);
                }
                analysis = this.AnalyzeTile(tile);
            }

            // Move land
            if (analysis.waterHeight > 0) {
                analysis.landHeight = analysis.waterHeight;
                analysis.surface.baseHeight = analysis.waterHeight;
                analysis.surface.waterHeight = 0;
            }

            // Construct
            if (objectsInfo.footpathObject != null) {
                this.InsertNewFootpathElement(tile, analysis.surfaceIndex + 1, {
                    baseHeight: analysis.landHeight,
                    footpathType: objectsInfo.footpathObject.index,
                    edgesAndCorners: this.CalculatePathEdges(regionInfo)
                });
            }

            park.cash -= cost;
        }
    }, {
        key: "PreConstructPool",
        value: function PreConstructPool(tile, analysis, regionInfo, objectsInfo) {
            var cost = 0;

            var minClearance = analysis.landHeight - 4;
            var maxClearance = analysis.landHeight + 4;
            if (analysis.waterHeight > 0) {
                minClearance += 4;
                maxClearance += 4;
            } else {
                cost += 900;
            }

            // Preclear
            var result = this.PreClearArea(analysis, minClearance, maxClearance);
            if (!result.success) return { success: false };else {
                result.tile = tile;
                result.analysis = analysis;
                result.regionInfo = regionInfo;
                result.objectsInfo = objectsInfo;
                result.minClearance = minClearance;
                result.maxClearance = maxClearance;
                result.cost += cost;
                return result;
            }
        }
    }, {
        key: "ConstructPool",
        value: function ConstructPool(preconstruction) {
            var tile = preconstruction.tile;
            var analysis = preconstruction.analysis;
            var regionInfo = preconstruction.regionInfo;
            var objectsInfo = preconstruction.objectsInfo;
            var cost = preconstruction.cost;
            var indicesToRemove = preconstruction.indicesToRemove;

            // Destruct
            if (indicesToRemove.length > 0) {
                indicesToRemove.sort();
                for (var i = indicesToRemove.length - 1; i >= 0; i--) {
                    tile.removeElement(indicesToRemove[i]);
                }
                analysis = this.AnalyzeTile(tile);
            }

            // Move land
            if (analysis.waterHeight == 0) {
                analysis.landHeight -= 4;
                analysis.surface.baseHeight = analysis.landHeight;
                analysis.surface.waterHeight = (analysis.landHeight + 4) * 8;
            }

            // // Construct
            // if (objectsInfo.footpathObject != null) {
            //     this.InsertNewFootpathElement(tile, analysis.surfaceIndex + 1, {
            //         baseHeight: analysis.landHeight,
            //         footpathType: objectsInfo.footpathObject.index,
            //         edgesAndCorners: this.CalculatePathEdges(regionInfo)
            //     });
            // }

            park.cash -= cost;
            return analysis;
        }
    }]);

    return TileHelper;
}();

// /// <reference path="../../../bin/openrct2.d.ts" />

var downCoord = void 0;
var currentCoord = void 0;

var direction = 0;

var pathType = 0;
var lineColor = 0;

var objectHelper = void 0;
function initializeHelpers() {
    objectHelper = new ObjectHelper();
}

function selectTheMap() {
    var left = Math.min(downCoord.x, currentCoord.x);
    var right = Math.max(downCoord.x, currentCoord.x);
    var top = Math.min(downCoord.y, currentCoord.y);
    var bottom = Math.max(downCoord.y, currentCoord.y);
    ui.tileSelection.range = {
        leftTop: { x: left, y: top },
        rightBottom: { x: right, y: bottom }
    };
}

function analyzeSelection(left, right, top, bottom) {
    var selection = { errors: [], tiles: [] };
    var height = null;
    for (var x = left; x <= right; x++) {
        var column = [];
        for (var y = bottom; y <= top; y++) {
            var analysis = TileHelper.AnalyzeTile(map.getTile(x, y));

            if (!analysis.hasSurface) selection.errors.push("There is no surface here.");else {
                var poolHeight = analysis.landHeight;
                if (analysis.waterHeight == poolHeight + 4) poolHeight += 4;else if (analysis.waterHeight != 0) selection.errors.push("Water is not the correct depth for a pool.");
                if (analysis.slope != 0) selection.errors.push("Land must be flat.");
                if (height == null) height = poolHeight;else if (poolHeight != height) selection.errors.push("Land (or pool) must be at the same height.");
            }
            column.push(analysis);
        }
        selection.tiles.push(column);
    }
    selection.poolHeight = height;
    return selection;
}

function finishSelection() {
    var left = Math.floor(Math.min(downCoord.x, currentCoord.x) / 32);
    var right = Math.floor(Math.max(downCoord.x, currentCoord.x) / 32);
    var bottom = Math.floor(Math.min(downCoord.y, currentCoord.y) / 32);
    var top = Math.floor(Math.max(downCoord.y, currentCoord.y) / 32);

    // const roadLineWall = objectHelper.GetObjectIndex("wall", lineStyles[lineStyle]);

    var viewRotation = ui.mainViewport.rotation;
    viewRotation += direction;
    while (viewRotation > 1) {
        viewRotation -= 2;
    }

    var footpathObject = null;
    if (pathType >= 0) footpathObject = objectHelper.GetAllPaths()[pathType];
    var selection = analyzeSelection(left, right, top, bottom);
    if (selection.errors.length > 0) {
        ui.showError("Can't build pool here:", selection.errors[0]);
        return;
    }

    var preconstructions = [];
    var totalCost = 0;
    try {
        for (var x = left; x <= right; x++) {
            for (var y = bottom; y <= top; y++) {
                var regionInfo = {
                    left: left, right: right,
                    top: top, bottom: bottom,
                    x: x, y: y };

                var tile = map.getTile(x, y);
                var analysis = selection.tiles[x - left][y - bottom];

                var preconstruction = TileHelper.PreConstructPool(tile, analysis, regionInfo, { footpathObject: footpathObject });
                if (!preconstruction.success) return;
                totalCost += preconstruction.cost;
                preconstructions.push(preconstruction);
                // let pathElement = tile.insertElement(surfaceIndex + 1);
                // pathElement.type = "footpath";
                // pathElement.baseHeight = baseHeight;
                // pathElement.clearanceHeight = 4;
                // let pathElement = MapHelper.PlaceFootpath(tile, pathObject.index, selection.poolHeight);
                // pathElement.edgesAndCorners = edges;
                // MapHelper.SetFootpathType(tile, surfaceIndex + 1, pathObject.index);

                // let tile = map.getTile(x, y);
                // let surfaceHeight = MapHelper.GetTileSurfaceZ(x, y);


                // if ((viewRotation === 0 && x !== left) || (viewRotation === 1 && y !== bottom)) {
                //     let elementN = MapHelper.PlaceWall(tile, roadLineWall, surfaceHeight - lineStyleHeights[lineStyle]);
                //     MapHelper.SetTileElementRotation(tile, elementN._index, 0 + viewRotation);
                //     MapHelper.SetPrimaryTileColor(tile, elementN._index, colors[lineColor]);
                // }

                // if ((viewRotation === 0 && x !== right) || (viewRotation === 1 && y !== top)) {
                //     let elementS = MapHelper.PlaceWall(tile, roadLineWall, surfaceHeight - lineStyleHeights[lineStyle]);
                //     MapHelper.SetTileElementRotation(tile, elementS._index, 2 + viewRotation);
                //     MapHelper.SetPrimaryTileColor(tile, elementS._index, colors[lineColor]);
                // }
            }
        }

        // Check cost
        if (totalCost > 0 && totalCost > park.cash) {
            ui.showError("Can't build pool here:", "Not enough cash - requires $" + totalCost / 10);
            return;
        }

        while (preconstructions.length > 0) {
            TileHelper.ConstructPool(preconstructions.pop());
        }
    } catch (ex) {
        ui.showError("Exception:", "" + ex);
    }
}

var main = function main() {
    if (typeof ui === 'undefined') {
        return;
    }
    var window = null;
    ui.registerMenuItem("Swimming Pool", function () {
        initializeHelpers();
        if (ui.tool && ui.tool.id == "swimming-pool-tool") {
            ui.tool.cancel();
        } else {
            ui.activateTool({
                id: "swimming-pool-tool",
                cursor: "cross_hair",
                onStart: function onStart(e) {
                    ui.mainViewport.visibilityFlags |= 1 << 7;
                },
                onDown: function onDown(e) {
                    if (e.mapCoords.x === 0 && e.mapCoords.y === 0) {
                        return;
                    }
                    downCoord = e.mapCoords;
                    currentCoord = e.mapCoords;
                },
                onMove: function onMove(e) {
                    if (e.mapCoords.x === 0 && e.mapCoords.y === 0) {
                        return;
                    }
                    if (e.isDown) {
                        console.log(e.mapCoords);
                        currentCoord = e.mapCoords;
                        selectTheMap();
                    } else {
                        downCoord = e.mapCoords;
                        currentCoord = e.mapCoords;
                        selectTheMap();
                    }
                },
                onUp: function onUp(e) {
                    finishSelection();
                    ui.tileSelection.range = null;
                },
                onFinish: function onFinish() {
                    ui.tileSelection.range = null;
                    ui.mainViewport.visibilityFlags &= ~(1 << 7);
                    if (window != null) window.close();
                }
            });
            if (window == null) {
                var width = 300;
                var buttonWidth = 50;
                var switchWidth = 32;
                var buttonsHeight = 40 + 18 * 2;
                var paths = objectHelper.GetAllPaths().map(function (p) {
                    return p.name;
                });
                window = ui.openWindow({
                    classification: 'park',
                    title: "Swimming Pool",
                    width: width,
                    height: buttonsHeight + 20,
                    widgets: [{
                        type: 'label',
                        name: 'label-description',
                        x: 3,
                        y: 23,
                        width: width - 6,
                        height: 26,
                        text: "Drag to construct roadlines."
                    }, {
                        type: 'button',
                        name: "button-cancel",
                        x: width - buttonWidth - 6,
                        y: buttonsHeight,
                        width: buttonWidth,
                        height: 16,
                        text: "Cancel",
                        onClick: function onClick() {
                            if (window != null) window.close();
                        }
                    }, {
                        type: 'label',
                        name: 'label-direction',
                        x: 3,
                        y: buttonsHeight + 2,
                        width: width - 6,
                        height: 26,
                        text: "Direction:"
                    }, {
                        type: 'button',
                        name: "button-left",
                        x: 3 + 60,
                        y: buttonsHeight,
                        width: switchWidth,
                        height: 16,
                        text: "\\",
                        onClick: function onClick() {
                            direction = 0;
                        }
                    }, {
                        type: 'button',
                        name: "button-right",
                        x: 3 + switchWidth + 8 + 60,
                        y: buttonsHeight,
                        width: switchWidth,
                        height: 16,
                        text: "/",
                        onClick: function onClick() {
                            direction = 1;
                        }
                    }, {
                        type: 'label',
                        name: 'label-style',
                        x: 3,
                        y: 40,
                        width: 60 - 6,
                        height: 26,
                        text: "Style:"
                    }, {
                        type: "dropdown",
                        x: 3 + 60,
                        y: 40,
                        width: width - 6 - (3 + 60),
                        height: 12,
                        name: "paths-dropdown",
                        text: "",
                        items: paths,
                        selectedIndex: pathType,
                        onChange: function onChange(e) {
                            pathType = e;
                        }
                    }, {
                        type: 'label',
                        name: 'label-color',
                        x: 3,
                        y: 40 + 18,
                        width: 60 - 6,
                        height: 26,
                        text: "Color:"
                    }, {
                        type: "dropdown",
                        x: 3 + 60,
                        y: 40 + 18,
                        width: width - 6 - (3 + 60),
                        height: 12,
                        name: "line_color",
                        text: "",
                        items: ["White", "Yellow", "Blue", "Grey", "Black"],
                        selectedIndex: lineColor,
                        onChange: function onChange(e) {
                            lineColor = e;
                        }
                    }],
                    onClose: function onClose() {
                        window = null;
                        if (ui.tool && ui.tool.id == "swimming-pool-tool") {
                            ui.tool.cancel();
                        }
                    }
                });
            } else {
                window.bringToFront();
            }
        }
    });
};

registerPlugin({
    name: 'Swimming Pool',
    version: '1.0',
    licence: 'MIT',
    authors: ['AlexKven'],
    type: 'local',
    main: main
});
