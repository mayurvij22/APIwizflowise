
let nodeIdCounter = 1;

/**
 * Generate nodes/edges from JSON with optional auto layout.
 * @param {any} json - parsed JSON value (object/array/primitive)
 * @param {string|null} parentId - optional parent id
 * @param {string} path - JSONPath-like label anchor
 * @param {object} options - { layout: 'none'|'dagre', direction: 'TB'|'LR'|'BT'|'RL' }
 */
export async function generateTreeData(json, parentId = null, path = "$", options = { layout: "none", direction: "TB" }) {
  nodeIdCounter = 1; // reset for each run to keep ids compact
  const nodes = [];
  const edges = [];

  function traverse(obj, parent, currentPath) {
    const id = `node-${nodeIdCounter++}`;

    const type = Array.isArray(obj)
      ? "array"
      : obj && typeof obj === "object"
      ? "object"
      : "primitive";

    // Human-friendly label: show path + type/value
    const label =
      type === "array"
        ? `${currentPath} (Array)`
        : type === "object"
        ? `${currentPath} (Object)`
        : `${currentPath}: ${String(obj)}`;

    // store width/height hints for layout engines
    const sizeHint = { width: 180, height: 44 };

    nodes.push({
      id,
      data: { label, type, path: currentPath, value: type === "primitive" ? obj : undefined },
      position: { x: 0, y: 0 }, // will be set by layout later if enabled
      sourcePosition: options.direction === "LR" ? "right" : options.direction === "RL" ? "left" : "bottom",
      targetPosition: options.direction === "LR" ? "left" : options.direction === "RL" ? "right" : "top",
      // you can style by type in the UI; keep it minimal in the controller layer
      style: undefined,
      // layout hints (used by dagre/elk calculations)
      __size: sizeHint,
    });

    if (parent) {
      edges.push({
        id: `edge-${parent.id}-${id}`,
        source: parent.id,
        target: id,
      });
    }

    if (type === "object") {
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        traverse(obj[key], { id }, `${currentPath}.${key}`);
      }
    } else if (type === "array") {
      obj.forEach((item, index) => {
        traverse(item, { id }, `${currentPath}[${index}]`);
      });
    }
  }

  traverse(json, parentId ? { id: parentId } : null, path);

  // Optional auto layout using dagre
  if (options.layout === "dagre" && nodes.length) {
    const { layoutWithDagre } = await import("./layout/dagreLayout.js");
    const { nodes: laidOutNodes, edges: laidOutEdges } = layoutWithDagre(nodes, edges, options.direction || "TB");
    return { nodes: laidOutNodes, edges: laidOutEdges };
  }

  return { nodes, edges };
}
