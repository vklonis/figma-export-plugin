"use strict";
// BannerForge Figma Plugin - Main Code
// This runs in the Figma plugin sandbox with full access to the document
// Show the UI
figma.showUI(__html__, { width: 400, height: 600 });
// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
    if (msg.type === "get-frames") {
        const frames = figma.currentPage.children.filter((node) => node.type === "FRAME");
        const frameList = frames.map((frame) => ({
            id: frame.id,
            name: frame.name,
            width: frame.width,
            height: frame.height,
        }));
        figma.ui.postMessage({
            type: "frames-list",
            frames: frameList,
        });
    }
    if (msg.type === "export-frames") {
        try {
            const frameIds = msg.frameIds;
            await exportFrames(frameIds);
        }
        catch (error) {
            figma.ui.postMessage({
                type: "export-error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    if (msg.type === "cancel") {
        figma.closePlugin();
    }
};
async function exportFrames(frameIds) {
    const exportData = {
        meta: {
            pluginVersion: "1.0.0",
            exportDate: new Date().toISOString(),
            figmaFileKey: figma.fileKey || "unknown",
            figmaFileName: figma.root.name,
        },
        frames: [],
        images: {},
    };
    let processedFrames = 0;
    for (const frameId of frameIds) {
        const node = figma.getNodeById(frameId);
        if (!node || node.type !== "FRAME") {
            continue;
        }
        const frame = node;
        // Update progress
        figma.ui.postMessage({
            type: "export-progress",
            current: processedFrames + 1,
            total: frameIds.length,
            frameName: frame.name,
        });
        // Extract frame background color
        const backgroundColor = extractBackgroundColor(frame);
        // Process all nodes in the frame
        const nodes = [];
        const imageData = {};
        await processNodeRecursive(frame, frame, nodes, imageData);
        exportData.frames.push({
            id: frame.id,
            name: frame.name,
            width: frame.width,
            height: frame.height,
            backgroundColor,
            nodes,
        });
        // Convert images to base64
        for (const [key, bytes] of Object.entries(imageData)) {
            exportData.images[key] = uint8ArrayToBase64(bytes);
        }
        processedFrames++;
    }
    // Send complete export data
    figma.ui.postMessage({
        type: "export-complete",
        data: exportData,
    });
}
async function processNodeRecursive(node, rootFrame, outputNodes, images) {
    // Skip hidden nodes
    if (!node.visible) {
        return;
    }
    // Calculate position relative to the root frame using absolute transforms.
    // node.x/y are relative to the direct parent, so we must use absoluteTransform
    // which gives the true page-space position, then subtract the frame origin.
    const absTransform = node.absoluteTransform;
    const frameTransform = rootFrame.absoluteTransform;
    let relativeX;
    let relativeY;
    if (absTransform) {
        relativeX = absTransform[0][2] - frameTransform[0][2];
        relativeY = absTransform[1][2] - frameTransform[1][2];
    }
    else {
        relativeX = node.x - rootFrame.x;
        relativeY = node.y - rootFrame.y;
    }
    // Extract rotation
    const rotation = "rotation" in node ? node.rotation || 0 : 0;
    // Base node data
    const exportNode = {
        id: node.id,
        name: node.name,
        type: node.type,
        x: relativeX,
        y: relativeY,
        width: "width" in node ? node.width : 0,
        height: "height" in node ? node.height : 0,
        rotation,
        opacity: "opacity" in node ? node.opacity : 1,
        visible: node.visible,
        locked: node.locked || false,
        blendMode: "blendMode" in node ? node.blendMode : "NORMAL",
    };
    // Handle different node types
    switch (node.type) {
        case "RECTANGLE":
        case "ELLIPSE":
            await processShapeNode(node, exportNode, images);
            break;
        case "TEXT":
            await processTextNode(node, exportNode);
            break;
        case "VECTOR":
        case "STAR":
        case "LINE":
        case "POLYGON":
        case "BOOLEAN_OPERATION":
            // Export as rasterized image
            await exportAsImage(node, exportNode, images);
            break;
        case "FRAME":
        case "GROUP":
        case "INSTANCE":
        case "COMPONENT":
            // Export fills for frames (background color, image fills, etc.)
            if ("fills" in node && node.fills !== figma.mixed) {
                exportNode.fills = await processPaints(node.fills, images);
            }
            // Process children recursively
            if ("children" in node) {
                exportNode.children = [];
                for (const child of node.children) {
                    await processNodeRecursive(child, rootFrame, exportNode.children, images);
                }
            }
            break;
        default:
            // Unsupported node type - try to export as image
            await exportAsImage(node, exportNode, images);
            break;
    }
    outputNodes.push(exportNode);
}
async function processShapeNode(node, exportNode, images) {
    // Extract fills
    if ("fills" in node && node.fills !== figma.mixed) {
        exportNode.fills = await processPaints(node.fills, images);
    }
    // Extract strokes
    if ("strokes" in node && Array.isArray(node.strokes)) {
        exportNode.strokes = await processPaints(node.strokes, images);
        exportNode.strokeWeight = node.strokeWeight;
        exportNode.strokeAlign = node.strokeAlign;
    }
    // Corner radius (for rectangles)
    if (node.type === "RECTANGLE" &&
        "cornerRadius" in node &&
        typeof node.cornerRadius !== "symbol") {
        exportNode.cornerRadius = node.cornerRadius;
    }
    // Effects (shadows, blurs)
    if ("effects" in node) {
        exportNode.effects = [...node.effects];
    }
}
async function processTextNode(node, exportNode) {
    // Load all fonts used in the text
    try {
        if (node.fontName !== figma.mixed) {
            await figma.loadFontAsync(node.fontName);
        }
    }
    catch (error) {
        console.warn("Could not load fonts for text node:", node.name);
    }
    // Extract text content
    exportNode.characters = node.characters;
    // Extract typography - handle mixed styles
    exportNode.fontSize = node.fontSize;
    exportNode.fontName = node.fontName;
    exportNode.fontWeight = getFontWeight(node.fontName);
    exportNode.textAlignHorizontal = node.textAlignHorizontal;
    exportNode.textAlignVertical = node.textAlignVertical;
    exportNode.letterSpacing = node.letterSpacing;
    exportNode.lineHeight = node.lineHeight;
    exportNode.textCase =
        node.textCase !== figma.mixed ? node.textCase : "ORIGINAL";
    exportNode.textDecoration =
        node.textDecoration !== figma.mixed ? node.textDecoration : "NONE";
    // Extract fills (text color)
    if (node.fills !== figma.mixed) {
        exportNode.fills = await processPaints(node.fills, {});
    }
}
async function processPaints(paints, images) {
    const result = [];
    for (const paint of paints) {
        if (paint.type === "SOLID") {
            result.push({
                type: "SOLID",
                color: paint.color,
                opacity: paint.opacity,
            });
        }
        else if (paint.type === "IMAGE" && paint.imageHash) {
            // Export image fill
            const image = figma.getImageByHash(paint.imageHash);
            if (image) {
                const bytes = await image.getBytesAsync();
                const imageKey = paint.imageHash;
                images[imageKey] = bytes;
                result.push({
                    type: "IMAGE",
                    imageHash: paint.imageHash,
                    scaleMode: paint.scaleMode,
                    opacity: paint.opacity,
                });
            }
        }
        else if (paint.type === "GRADIENT_LINEAR" ||
            paint.type === "GRADIENT_RADIAL" ||
            paint.type === "GRADIENT_ANGULAR" ||
            paint.type === "GRADIENT_DIAMOND") {
            result.push({
                type: paint.type,
                gradientStops: paint.gradientStops,
                gradientTransform: paint.gradientTransform,
                opacity: paint.opacity,
            });
        }
    }
    return result;
}
async function exportAsImage(node, exportNode, images) {
    try {
        const bytes = await node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: 2 }, // 2x for quality
        });
        const imageKey = `node_${node.id}`;
        images[imageKey] = bytes;
        exportNode.fills = [
            {
                type: "IMAGE",
                imageHash: imageKey,
                scaleMode: "FILL",
                opacity: 1,
            },
        ];
    }
    catch (error) {
        console.warn("Could not export node as image:", node.name, error);
    }
}
function extractBackgroundColor(frame) {
    if (frame.fills === figma.mixed || !Array.isArray(frame.fills)) {
        return "#FFFFFF";
    }
    const solidFill = frame.fills.find((fill) => fill.type === "SOLID");
    if (solidFill && solidFill.color) {
        return rgbToHex(solidFill.color);
    }
    return "#FFFFFF";
}
function rgbToHex(color) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
function getFontWeight(fontName) {
    if (typeof fontName === "symbol")
        return 400;
    const font = fontName;
    const style = font.style.toLowerCase();
    if (style.includes("thin"))
        return 100;
    if (style.includes("extralight") || style.includes("ultralight"))
        return 200;
    if (style.includes("light"))
        return 300;
    if (style.includes("medium"))
        return 500;
    if (style.includes("semibold") || style.includes("demibold"))
        return 600;
    if (style.includes("bold"))
        return 700;
    if (style.includes("extrabold") || style.includes("ultrabold"))
        return 800;
    if (style.includes("black") || style.includes("heavy"))
        return 900;
    return 400; // Regular
}
function uint8ArrayToBase64(bytes) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    const len = bytes.length;
    for (let i = 0; i < len; i += 3) {
        const b0 = bytes[i];
        const b1 = i + 1 < len ? bytes[i + 1] : 0;
        const b2 = i + 2 < len ? bytes[i + 2] : 0;
        result += chars[b0 >> 2];
        result += chars[((b0 & 3) << 4) | (b1 >> 4)];
        result += i + 1 < len ? chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
        result += i + 2 < len ? chars[b2 & 63] : "=";
    }
    return result;
}
