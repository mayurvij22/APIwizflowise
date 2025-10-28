
import dagre from "@dagrejs/dagre";

export function layoutWithDagre(nodes, edges, direction = "TB") {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction });
  g.setDefaultEdgeLabel(() => ({}));

  // node size hints
  const nodeWidth = 180;
  const nodeHeight = 44;

  nodes.forEach((n) => {
    const w = n.__size?.width ?? nodeWidth;
    const h = n.__size?.height ?? nodeHeight;
    g.setNode(n.id, { width: w, height: h });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const isHorizontal = direction === "LR" || direction === "RL";

  const newNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: { x: pos.x - (n.__size?.width ?? nodeWidth) / 2, y: pos.y - (n.__size?.height ?? nodeHeight) / 2 },
    };
  });

  return { nodes: newNodes, edges };
}
