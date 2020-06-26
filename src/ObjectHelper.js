
class ObjectHelper {
    constructor() {
        var paths = null;
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
}

export default ObjectHelper;