class TileHelper {
    // 'pAB' = X above, Y below
    // 'pB0' = X below, Y same, etc.
    static CalculatePathEdges(
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

    static ConstructDeck(tile, analysis) {
        let cost = 0;

        let indicesToRemove = [];
        let minClearance = analysis.landHeight;
        let maxClearance = analysis.landHeight + 4;
        if (analysis.waterHeight > 0) {
            maxClearance += 4;
            cost += 400;
        }
        
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
                return analysis;
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
                return analysis;
            }
        }
        for (let i = 0; i < analysis.largeSceneries.length; i++) {
            element = analysis.largeSceneries[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Large scenery in the way");
                return analysis;
            }
        }
        for (let i = 0; i < analysis.banners.length; i++) {
            element = analysis.banners[i];
            if (element.baseHeight >= minClearance &&
                element.baseHeight <= maxClearance) {
                    ui.showError("Can't build pool here:", "Banner in the way");
                return analysis;
            }
        }

        if (cost > 0 && cost > park.cash) {
            ui.showError("Can't build pool here:", `Not enough cash - required $${cost}`);
            return analysis;
        }
        if (indicesToRemove.length > 0)
        {
            indicesToRemove.sort();
            for (let i = indicesToRemove.length - 1; i >= 0; i--) {
                tile.removeElement(indicesToRemove[i]);
            }
            analysis = this.AnalyzeTile(tile);
        }

        if (analysis.waterHeight > 0)
            analysis.surface.baseHeight = analysis.waterHeight;

        park.cash -= cost;
        return analysis;
    }
}

export default TileHelper;