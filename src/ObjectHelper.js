
class ObjectHelper {
    constructor() {
        var paths = null;
        var walls = null;
    }

    GetObjectIndex(type, identifier) {
        let list = context.getAllObjects(type)
        for (let i = 0; i < list.length; i++) {
            let obj = list[i];
            if (obj.identifier.trim() === identifier) {
                return obj.index;
            }
        }
    }

    GetAllPaths() {
        if (this.paths)
            return this.paths;
        this.paths = context.getAllObjects("footpath");
        return this.GetAllPaths();
    }

    GetWall(objId) {
        if (this.walls) {
            var filtered = this.walls.filter(w => {
                if (w.legacyIdentifier == null)
                    return false;
                else
                    return w.legacyIdentifier == objId;
            });
            if (filtered.length > 0)
                return filtered[0];
            else
                return null;
        }
        this.walls = context.getAllObjects("wall");
        return this.GetWall(objId);
    }
}

export default ObjectHelper;