class TileHelper {
    // 'pAB' = X above, Y below
    // 'pB0' = X below, Y same, etc.
    static ManuallyCalculatePathEdges(
        pB0, pA0, p0B, p0A,
        pBA, pAA, pAB, pBB) {
        let result = 0;
        if (pB0)
            result += 1;
        if (pA0)
            result += 4;
        if (p0A)
            result += 2;
        if (p0B)
            result += 8;
        if (pBA && pB0 && p0A)
            result += 16;
        if (pAA && pA0 && p0A)
            result += 32;
        if (pAB && pA0 && p0B)
            result += 64;
        if (pBB && pB0 && p0B)
            result += 128;
        return result;
    }

    static CalculatePathEdges(regionInfo) {
        let xAbove = regionInfo.x < regionInfo.right;
        let xBelow = regionInfo.x > regionInfo.left;
        let yAbove = regionInfo.y < regionInfo.top;
        let yBelow = regionInfo.y > regionInfo.bottom;
        return this.ManuallyCalculatePathEdges(
            xBelow, xAbove, yBelow, yAbove,
            xBelow && yAbove, xAbove && yAbove,
            xAbove && yBelow, xBelow && yBelow);
    }

    static AnalyzeTile(tile) {
        let result = { 
            hasSurface: false,
            footpaths: [],
            tracks: [],
            smallSceneries: [],
            walls: [],
            entrances: [],
            largeSceneries: [],
            banners: [] };
        for (let i = 0; i < tile.numElements; i++) {
            let element = tile.getElement(i);
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

    static ConnectFootpathsBeyondEdge(regionInfo, footpathElement) {

    }

    static InsertNewFootpathElement(tile, index, desc) {
        let footpathElement = tile.insertElement(index);

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
            
            let data = tile.data;
            let baseIndex = 16 * index;
            data[baseIndex + 4] = desc.footpathType;
            tile.data = data;
        }
        catch (ex) {
            ui.showError("exception:", `${ex}`);
        }
    }

    static PreClearArea(analysis, minClearance, maxClearance) {
        let cost = 0;
        let indicesToRemove = [];

        let element;
        let object;
        for (let i = 0; i < analysis.footpaths.length; i++) {
            element = analysis.footpaths[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                indicesToRemove.push(element.tileIndex);
                cost -= 100;
            }
        }
        for (let i = 0; i < analysis.tracks.length; i++) {
            element = analysis.tracks[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Track in the way");
                return { success: false, cost: null, indicesToRemove: null };
            }
        }
        for (let i = 0; i < analysis.smallSceneries.length; i++) {
            element = analysis.smallSceneries[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                indicesToRemove.push(element.tileIndex);
                object = context.getObject("small_scenery", element.object);
                cost += object.removalPrice * 10;
            }
        }
        for (let i = 0; i < analysis.walls.length; i++) {
            element = analysis.walls[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                indicesToRemove.push(element.tileIndex);
            }
        }
        for (let i = 0; i < analysis.entrances.length; i++) {
            element = analysis.entrances[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Entrance or exit in the way");
                return { success: false, cost: null, indicesToRemove: null };
            }
        }
        for (let i = 0; i < analysis.largeSceneries.length; i++) {
            element = analysis.largeSceneries[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Large scenery in the way");
                return { success: false, cost: null, indicesToRemove: null };
            }
        }
        for (let i = 0; i < analysis.banners.length; i++) {
            element = analysis.banners[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Banner in the way");
                return { success: false, cost: null, indicesToRemove: null };
            }
        }

        return { success: true, cost: cost, indicesToRemove: indicesToRemove };
    }

    static PreConstructDeck(tile, analysis, regionInfo, objectsInfo) {
        let cost = 0;

        let minClearance = analysis.landHeight;
        let maxClearance = analysis.landHeight + 4;
        if (analysis.waterHeight > 0) {
            maxClearance += 4;
            cost += 400;
        }
        if (objectsInfo.footpathObject != null)
            cost += 120;
        

        // Preclear
        let result = this.PreClearArea(analysis, minClearance, maxClearance);
        if (!result.success)
            return { success: false };
        else {
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

    static ConstructDeck(preconstruction) {
        let tile = preconstruction.tile;
        let analysis = preconstruction.analysis;
        let regionInfo = preconstruction.regionInfo;
        let objectsInfo = preconstruction.objectsInfo;
        let cost = preconstruction.cost;
        let indicesToRemove = preconstruction.indicesToRemove;

        if (indicesToRemove.length > 0)
        {
            indicesToRemove.sort();
            for (let i = indicesToRemove.length - 1; i >= 0; i--) {
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

    // Doesn't work right now
    static ConstructPool(tile, analysis, regionInfo, objectsInfo) {
        let cost = 0;

        let minClearance = analysis.landHeight - 4;
        let maxClearance = analysis.landHeight + 4;
        if (analysis.waterHeight > 0) {
            minClearance += 4;
            maxClearance += 4;
        } else {
            cost += 900;
        }
        
        // Destruct
        let removal = this.PreClearArea(analysis, minClearance, maxClearance);
        if (!removal.success)
            return analysis;
        cost += removal.cost;
        if (removal.indicesToRemove.length > 0)
        {
            removal.indicesToRemove.sort();
            for (let i = removal.indicesToRemove.length - 1; i >= 0; i--) {
                tile.removeElement(removal.indicesToRemove[i]);
            }
            analysis = this.AnalyzeTile(tile);
        }

        // Check cost
        if (cost > 0 && cost > park.cash) {
            ui.showError("Can't build pool here:", `Not enough cash - requires $${cost}`);
            return analysis;
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
}

export default TileHelper;