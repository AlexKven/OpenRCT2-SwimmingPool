// /// <reference path="../../../bin/openrct2.d.ts" />

import MapHelper from "./MapHelper";
import ObjectHelper from "./ObjectHelper";
import TileHelper from "./TileHelper";
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

function analyzeSelection(left, right, top, bottom)
{
    let selection = { errors: [], tiles: [] };
    var height = null;
    for (let x = left; x <= right; x++) {
        let column = [];
        for (let y = bottom; y <= top; y++) {
            let analysis = TileHelper.AnalyzeTile(map.getTile(x, y));
            
            if (!analysis.hasSurface)
                selection.errors.push("There is no surface here.");
            else {
                let poolHeight = analysis.landHeight;
                if (analysis.waterHeight == poolHeight + 4)
                    poolHeight += 4;
                else if (analysis.waterHeight != 0)
                    selection.errors.push("Water is not the correct depth for a pool.");
                if (analysis.slope != 0)
                    selection.errors.push("Land must be flat.");
                if (height == null)
                    height = poolHeight;
                else if (poolHeight != height)
                selection.errors.push("Land (or pool) must be at the same height.");
            }
            column.push(analysis);
        }
        selection.tiles.push(column);
    }
    selection.poolHeight = height;
    return selection;
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

    let footpathObject = null;
    if (pathType >= 0)
        footpathObject = objectHelper.GetAllPaths()[pathType];
    var selection = analyzeSelection(left, right, top, bottom);
    if (selection.errors.length > 0) {
        ui.showError("Can't build pool here:", selection.errors[0]);
        return;
    }

    let preconstructions = [];
    let totalCost = 0;
    try {
    for (let x = left; x <= right; x++) {
        for (let y = bottom; y <= top; y++) {
            let regionInfo = {
                left: left, right: right,
                top: top, bottom: bottom,
                x: x, y: y };

            let tile = map.getTile(x, y);
            let analysis = selection.tiles[x - left][y - bottom];

            var preconstruction = TileHelper.PreConstructPool(tile, analysis, regionInfo,
                { 
                    footpathObject: footpathObject,
                    wallObject: objectHelper.GetWall("AK-PLWL ")});
            if (!preconstruction.success)
                return;
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
        ui.showError("Can't build pool here:", `Not enough cash - requires $${ totalCost / 10 }`);
        return;
    }

    while (preconstructions.length > 0) {
        TileHelper.ConstructPool(preconstructions.pop());
    }
    } catch (ex) {
         ui.showError("Exception:", `${ex}`);
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