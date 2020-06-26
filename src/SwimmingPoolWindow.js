class SwimmingPoolWindow {
    constructor(objectHelper) {
        const windowWidth = 300;
        const buttonWidth = 50;
        const switchWidth = 32;
        const windowHeight = 40 + 18 * 2;
        var window = null;
        var paths = objectHelper.GetAllPaths().map(p => p.name);
        var desc = {
            classification: 'park',
            title: "Swimming Pool",
            width: windowWidth,
            height: windowHeight + 20,
            widgets: [
                {
                    type: 'label',
                    name: 'label-description',
                    x: 3,
                    y: 23,
                    width: windowWidth - 6,
                    height: 26,
                    text: "Drag to construct roadlines."
                },
                {
                    type: 'button',
                    name: "button-cancel",
                    x: windowWidth - buttonWidth - 6,
                    y: windowHeight,
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
                    y: windowHeight + 2,
                    width: windowWidth - 6,
                    height: 26,
                    text: "Direction:"
                },
                {
                    type: 'button',
                    name: "button-left",
                    x: 3 + 60,
                    y: windowHeight,
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
                    y: windowHeight,
                    width: switchWidth,
                    height: 16,
                    text: "/",
                    onClick: function () {
                        direction = 1;
                    }
                },
                {
                    type: 'label',
                    name: 'label-path',
                    x: 3,
                    y: 40,
                    width: 60 - 6,
                    height: 26,
                    text: "Path:"
                },
                {
                    type: "dropdown",
                    x: 3 + 60,
                    y: 40,
                    width: windowWidth - 6 - (3 + 60),
                    height: 12,
                    name: "dropdown-path",
                    text: "",
                    items: paths,
                    selectedIndex: lineStyle,
                    onChange: function (e) {
                        lineStyle = e;
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
                    width: windowWidth - 6 - (3 + 60),
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
        };
    }

    open() {
        if (this.window == null)
            this.window = ui.openWindow(this.desc);
        else
            this.window.bringToFront();
    }

    close() {
        if (this.window)
            this.window.close();
    }
}

export default SwimmingPoolWindow;