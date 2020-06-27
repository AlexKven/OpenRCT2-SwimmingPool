// /// <reference path="../../../bin/openrct2.d.ts" />

import MapHelper from "./MapHelper";
import ObjectHelper from "./ObjectHelper";
import SwimmingPoolWindow from "./SwimmingPoolWindow";

let downCoord;
let currentCoord;

let direction = 0;

let pathType = 0;
let lineColor = 0;
const lineStyles = [
    "rct2.walllt32",
    "rct2.walllt32",
    "rct2.wallrh32",
    "rct2.wc17",
    "rct2.wc17"
];
const lineStyleHeights = [
    4,
    4,
    4,
    2,
    2
];
const striped = [
    false,
    true,
    false,
    false,
    true
];
const colors = [
    2, 18, 6, 1, 0
];

let objectHelper;
function initializeHelpers() {
    objectHelper = new ObjectHelper();
}

function selectTheMap() {
    let left = Math.min(downCoord.x, currentCoord.x);
    let right = Math.max(downCoord.x, currentCoord.x);
    let top = Math.min(downCoord.y, currentCoord.y);
    let bottom = Math.max(downCoord.y, currentCoord.y);
    ui.tileSelection.range = {
        leftTop: { x: left, y: top },
        rightBottom: { x: right, y: bottom }
    };
}

function validateSelection(left, right, top, bottom)
{
    var height = null;
    for (let x = left; x <= right; x++) {
        for (let y = bottom; y <= top; y++) {
            let tile = map.getTile(x, y);
            let surface = null;
            for (let i = 0; i < tile.numElements && surface == null; i++) {
                let element = tile.getElement(i);
                if (element.type == "surface")
                    surface = element;
            }
            if (surface == null)
                return "There is no land here.";
            if (surface.slope != 0)
                return "Land must be flat.";
            if (height == null)
                height = surface.baseHeight;
            else if (height != surface.baseHeight)
                return "Entire area must be at the same height.";
        }
    }
    return null;
}

function finishSelection() {
    let left = Math.floor(Math.min(downCoord.x, currentCoord.x) / 32);
    let right = Math.floor(Math.max(downCoord.x, currentCoord.x) / 32);
    let bottom = Math.floor(Math.min(downCoord.y, currentCoord.y) / 32);
    let top = Math.floor(Math.max(downCoord.y, currentCoord.y) / 32);

    // const roadLineWall = objectHelper.GetObjectIndex("wall", lineStyles[lineStyle]);

    let viewRotation = ui.mainViewport.rotation;
    viewRotation += direction;
    while (viewRotation > 1) {
        viewRotation -= 2;
    }

    let pathObject = objectHelper.GetAllPaths()[pathType];
    var error = validateSelection(left, right, top, bottom);
    if (error != null) {
        ui.showError("Can't build pool here:", error);
        return;
    }
    for (let x = left; x <= right; x++) {
        for (let y = bottom; y <= top; y++) {
            let xAbove = x < right;
            let xBelow = x > left;
            let yAbove = y < top;
            let yBelow = y > bottom;
            let edges = 0;
            if (xAbove)
                edges += 4;
            if (xBelow)
                edges += 1;
            if (yAbove)
                edges += 2;
            if (yBelow)
                edges += 8;
            if (xBelow && yAbove)
                edges += 16;
            if (yAbove && xAbove)
                edges += 32;
            if (xAbove && yBelow)
                edges += 64;
            if (yBelow && xBelow)
                edges += 128;

            let tile = map.getTile(x, y);
            let surface = null;
            let surfaceIndex = -1;
            let baseHeight = 0;
            for (let i = 0; i < tile.numElements && surface == null; i++) {
                let element = tile.getElement(i);
                if (element.type == "surface") {
                    surface = element;
                    surfaceIndex = i;
                    baseHeight = element.baseHeight;
                }
            }

            // let pathElement = tile.insertElement(surfaceIndex + 1);
            // pathElement.type = "footpath";
            // pathElement.baseHeight = baseHeight;
            // pathElement.clearanceHeight = 4;
            let pathElement = MapHelper.PlaceFootpath(tile, pathObject.index, surface.baseHeight);
            pathElement.edgesAndCorners = edges;
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
}

let main = function () {
    if (typeof ui === 'undefined') {
        return;
    }
    let window = null;
    ui.registerMenuItem("Swimming Pool", function () {
        initializeHelpers();
        if (ui.tool && ui.tool.id == "swimming-pool-tool") {
            ui.tool.cancel();
        } else {
            ui.activateTool({
                id: "swimming-pool-tool",
                cursor: "cross_hair",
                onStart: function (e) {
                    ui.mainViewport.visibilityFlags |= (1 << 7);
                },
                onDown: function (e) {
                    if (e.mapCoords.x === 0 && e.mapCoords.y === 0) {
                        return;
                    }
                    downCoord = e.mapCoords;
                    currentCoord = e.mapCoords;
                },
                onMove: function (e) {
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
                onUp: function (e) {
                    finishSelection();
                    ui.tileSelection.range = null;
                },
                onFinish: function () {
                    ui.tileSelection.range = null;
                    ui.mainViewport.visibilityFlags &= ~(1 << 7);
                    if (window != null)
                        window.close();
                },
            });
            if (window == null) {
                const width = 300;
                const buttonWidth = 50;
                const switchWidth = 32;
                const buttonsHeight = 40 + 18 * 2;
                var paths = objectHelper.GetAllPaths().map(p => p.name);
                window = ui.openWindow({
                    classification: 'park',
                    title: "Swimming Pool",
                    width: width,
                    height: buttonsHeight + 20,
                    widgets: [
                        {
                            type: 'label',
                            name: 'label-description',
                            x: 3,
                            y: 23,
                            width: width - 6,
                            height: 26,
                            text: "Drag to construct roadlines."
                        },
                        {
                            type: 'button',
                            name: "button-cancel",
                            x: width - buttonWidth - 6,
                            y: buttonsHeight,
                            width: buttonWidth,
                            height: 16,
                            text: "Cancel",
                            onClick: function () {
                                if (window != null)
                                    window.close();
                            }
                        },
                        {
                            type: 'label',
                            name: 'label-direction',
                            x: 3,
                            y: buttonsHeight + 2,
                            width: width - 6,
                            height: 26,
                            text: "Direction:"
                        },
                        {
                            type: 'button',
                            name: "button-left",
                            x: 3 + 60,
                            y: buttonsHeight,
                            width: switchWidth,
                            height: 16,
                            text: "\\",
                            onClick: function () {
                                direction = 0;
                            }
                        },
                        {
                            type: 'button',
                            name: "button-right",
                            x: 3 + switchWidth + 8 + 60,
                            y: buttonsHeight,
                            width: switchWidth,
                            height: 16,
                            text: "/",
                            onClick: function () {
                                direction = 1;
                            }
                        },
                        {
                            type: 'label',
                            name: 'label-style',
                            x: 3,
                            y: 40,
                            width: 60 - 6,
                            height: 26,
                            text: "Style:"
                        },
                        {
                            type: "dropdown",
                            x: 3 + 60,
                            y: 40,
                            width: width - 6 - (3 + 60),
                            height: 12,
                            name: "paths-dropdown",
                            text: "",
                            items: paths,
                            selectedIndex: pathType,
                            onChange: function (e) {
                                pathType = e;
                            }
                        },
                        {
                            type: 'label',
                            name: 'label-color',
                            x: 3,
                            y: 40 + 18,
                            width: 60 - 6,
                            height: 26,
                            text: "Color:"
                        },
                        {
                            type: "dropdown",
                            x: 3 + 60,
                            y: 40 + 18,
                            width: width - 6 - (3 + 60),
                            height: 12,
                            name: "line_color",
                            text: "",
                            items: ["White", "Yellow", "Blue", "Grey", "Black"],
                            selectedIndex: lineColor,
                            onChange: function (e) {
                                lineColor = e;
                            }
                        }
                    ],
                    onClose: function () {
                        window = null;
                        if (ui.tool && ui.tool.id == "swimming-pool-tool") {
                            ui.tool.cancel();
                        }
                    }
                });
            }
            else {
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