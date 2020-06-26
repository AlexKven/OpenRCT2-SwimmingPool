// /// <reference path="../../../bin/openrct2.d.ts" />

import MapHelper from "./MapHelper";
import ObjectHelper from "./ObjectHelper";
import SwimmingPoolWindow from "./SwimmingPoolWindow";

let downCoord;
let currentCoord;

let direction = 0;

let lineStyle = 0;
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

function finishSelection() {
    let left = Math.floor(Math.min(downCoord.x, currentCoord.x) / 32);
    let right = Math.floor(Math.max(downCoord.x, currentCoord.x) / 32);
    let top = Math.floor(Math.min(downCoord.y, currentCoord.y) / 32);
    let bottom = Math.floor(Math.max(downCoord.y, currentCoord.y) / 32);

    const roadLineWall = objectHelper.GetObjectIndex("wall", lineStyles[lineStyle]);

    let viewRotation = ui.mainViewport.rotation;
    viewRotation += direction;
    while (viewRotation > 1) {
        viewRotation -= 2;
    }

    for (let x = left; x <= right; x++) {
        if (striped[lineStyle] && viewRotation === 1 && x % 2 === 0) {
            continue;
        }
        for (let y = top; y <= bottom; y++) {
            if (striped[lineStyle] && viewRotation === 0 && y % 2 === 0) {
                continue;
            }

            let tile = map.getTile(x, y);
            let surfaceHeight = MapHelper.GetTileSurfaceZ(x, y);


            if ((viewRotation === 0 && x !== left) || (viewRotation === 1 && y !== bottom)) {
                let elementN = MapHelper.PlaceWall(tile, roadLineWall, surfaceHeight - lineStyleHeights[lineStyle]);
                MapHelper.SetTileElementRotation(tile, elementN._index, 0 + viewRotation);
                MapHelper.SetPrimaryTileColor(tile, elementN._index, colors[lineColor]);
            }

            if ((viewRotation === 0 && x !== right) || (viewRotation === 1 && y !== top)) {
                let elementS = MapHelper.PlaceWall(tile, roadLineWall, surfaceHeight - lineStyleHeights[lineStyle]);
                MapHelper.SetTileElementRotation(tile, elementS._index, 2 + viewRotation);
                MapHelper.SetPrimaryTileColor(tile, elementS._index, colors[lineColor]);
            }
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
            if (window == null)
                window = new SwimmingPoolWindow(objectHelper);
            window.open();
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