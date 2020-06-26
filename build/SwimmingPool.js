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

function validateSelection(left, right, top, bottom) {
    var height = null;
    for (var x = left; x <= right; x++) {
        for (var y = top; y <= bottom; y++) {
            var tile = map.getTile(x, y);
            var surface = null;
            for (var i = 0; i < tile.numElements && surface == null; i++) {
                var element = tile.getElement(i);
                if (element.type == "surface") surface = element;
            }
            if (surface == null) return "There is no land here.";
            if (surface.slope != 0) return "Land must be flat.";
            if (height == null) height = surface.baseHeight;else if (height != surface.baseHeight) return "Entire area must be at the same height.";
        }
    }
    return null;
}

function finishSelection() {
    var left = Math.floor(Math.min(downCoord.x, currentCoord.x) / 32);
    var right = Math.floor(Math.max(downCoord.x, currentCoord.x) / 32);
    var top = Math.floor(Math.min(downCoord.y, currentCoord.y) / 32);
    var bottom = Math.floor(Math.max(downCoord.y, currentCoord.y) / 32);

    // const roadLineWall = objectHelper.GetObjectIndex("wall", lineStyles[lineStyle]);

    var viewRotation = ui.mainViewport.rotation;
    viewRotation += direction;
    while (viewRotation > 1) {
        viewRotation -= 2;
    }

    var pathObject = objectHelper.GetAllPaths()[pathType];
    var error = validateSelection(left, right, top, bottom);
    if (error != null) {
        ui.showError("Can't build pool here:", error);
        return;
    }
    for (var x = left; x <= right; x++) {
        for (var y = top; y <= bottom; y++) {
            var xAbove = x < right;
            var xBelow = x > left;
            var yAbove = y < bottom;
            var yBelow = y > top;
            var edges = 0;
            if (xAbove) edges += 4;
            if (xBelow) edges += 1;
            if (yAbove) edges += 2;
            if (yBelow) edges += 8;
            if (xBelow && yAbove) edges += 16;
            if (yAbove && xAbove) edges += 32;
            if (xAbove && yBelow) edges += 64;
            if (yBelow && xBelow) edges += 128;

            var tile = map.getTile(x, y);
            var surface = null;
            var surfaceIndex = -1;
            var baseHeight = 0;
            for (var i = 0; i < tile.numElements && surface == null; i++) {
                var element = tile.getElement(i);
                if (element.type == "surface") {
                    surface = element;
                    surfaceIndex = i;
                    baseHeight = element.baseHeight;
                }
            }
            ui.showError("Base height:", "" + baseHeight);

            var path = tile.insertElement(surfaceIndex + 1);
            path.type = "footpath";
            path.baseHeight = baseHeight;
            path.footpathType = pathObject.index;
            path.edgesAndCorners = edges;
            path.slopeDirection = null;
            path.isWide = false;
            path.isQueue = false;
            path.queueBannerDirection = null;
            path.ride = 0;
            path.station = 0;
            path.addition = null;
            path.isAdditionBroken = false;

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
