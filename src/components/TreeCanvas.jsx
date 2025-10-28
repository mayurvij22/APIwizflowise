import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";

const nodeColors = {
  object: "#6366F1",
  array: "#10B981",
  primitive: "#F59E0B",
};

const getNodeType = (value) => {
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "object";
  return "primitive";
};

const previewValue = (val) => {
  try {
    if (val === null) return "null";
    if (typeof val === "object") {
      const s = JSON.stringify(val);
      return s.length > 60 ? s.slice(0, 60) + "…" : s;
    }
    if (typeof val === "string") return val.length > 60 ? val.slice(0, 60) + "…" : val;
    return String(val);
  } catch {
    return String(val);
  }
};

function parseJSONToNodes(data, parentId = null, depth = 0, prefix = "$", rowIdxOffset = 0) {
  const nodes = [];
  const edges = [];
  let rowIdx = rowIdxOffset;

  const pushNode = (id, label, type, value) => {
    const x = depth * 260;
    const y = rowIdx * 96;
    rowIdx += 1;
    nodes.push({
      id,
      data: { label, type, value, preview: previewValue(value) },
      position: { x, y },
      style: {
        background: "white",
        color: "#0f172a",
        padding: 0,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04)",
      },
    });
  };

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const id = `${prefix}[${index}]`;
      const type = getNodeType(item);
      pushNode(id, `[${index}]`, type, item);
      if (parentId) edges.push({ id: `${parentId}-${id}`, source: parentId, target: id, type: "smoothstep" });
      const child = parseJSONToNodes(item, id, depth + 1, `${prefix}[${index}]`, rowIdx);
      rowIdx = child.nextRowIdx;
      nodes.push(...child.nodes);
      edges.push(...child.edges);
    });
  } else if (data !== null && typeof data === "object") {
    Object.entries(data).forEach(([key, value]) => {
      const id = `${prefix}.${key}`;
      const type = getNodeType(value);
      pushNode(id, key, type, value);
      if (parentId) edges.push({ id: `${parentId}-${id}`, source: parentId, target: id, type: "smoothstep" });
      const child = parseJSONToNodes(value, id, depth + 1, `${prefix}.${key}`, rowIdx);
      rowIdx = child.nextRowIdx;
      nodes.push(...child.nodes);
      edges.push(...child.edges);
    });
  } else {
    const id = `${prefix}`;
    const type = getNodeType(data);
    pushNode(id, prefix, type, data);
    if (parentId) edges.push({ id: `${parentId}-${id}`, source: parentId, target: id, type: "smoothstep" });
  }

  return { nodes, edges, nextRowIdx: rowIdx };
}

/* Custom node with handles and compact preview */
const NodeCard = ({ id, data, selected, highlighted }) => {
  const color = nodeColors[data.type] || "#64748b";
  return (
    <div
      className={[
        "relative w-[260px] rounded-xl overflow-hidden border bg-white",
        highlighted
          ? "ring-2 ring-offset-2 ring-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.15)]"
          : selected
          ? "ring-2 ring-indigo-400"
          : "hover:ring-1 hover:ring-indigo-300",
      ].join(" ")}
      style={{ borderColor: "#e2e8f0" }}
    >
      <Handle type="target" position={Position.Left} id={`${id}-in`} style={{ background: color, width: 8, height: 8, borderRadius: 4 }} />
      <Handle type="source" position={Position.Right} id={`${id}-out`} style={{ background: color, width: 8, height: 8, borderRadius: 4 }} />

      <div className="px-3 py-2 flex items-center justify-between" style={{ background: `${color}10`, borderBottom: "1px solid #e2e8f0" }} title={data.label}>
        <div className="text-sm font-medium truncate">{data.label}</div>
        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: color, color: "white" }}>
          {data.type}
        </span>
      </div>
      <div className="px-3 py-2 text-[12px] text-slate-600 truncate" title={data.preview}>
        {data.preview}
      </div>
    </div>
  );
};

const TreeCanvas = ({ jsonData, searchTerm, fullscreen = true, autoFit = true }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);
  const containerRef = useRef(null);

  const normalizedSearch = useMemo(() => (searchTerm || "").trim().toLowerCase(), [searchTerm]);

  useEffect(() => {
    if (jsonData == null) return;
    try {
      const parsed =
        typeof jsonData === "string" && jsonData.trim()
          ? JSON.parse(jsonData)
          : jsonData && typeof jsonData === "object"
          ? jsonData
          : {};
      const { nodes, edges } = parseJSONToNodes(parsed, null, 0, "$");
      const styled = nodes.map((n) => ({ ...n, type: "jsonNode" }));
      setNodes(styled);
      setEdges(edges);
      if (autoFit && rfInstance) {
        requestAnimationFrame(() => rfInstance.fitView({ padding: 0.15, includeHiddenNodes: true, duration: 400 }));
      }
    } catch (err) {
      console.error("Invalid JSON:", err);
      setNodes([]);
      setEdges([]);
    }
  }, [jsonData, autoFit, rfInstance]);

  useEffect(() => {
    if (!normalizedSearch) {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, highlighted: false } })));
      return;
    }
    setNodes((nds) =>
      nds.map((n) => {
        const inId = n.id.toLowerCase().includes(normalizedSearch);
        const inLabel = String(n.data?.label || "").toLowerCase().includes(normalizedSearch);
        const inValue = String(n.data?.preview || "").toLowerCase().includes(normalizedSearch);
        return { ...n, data: { ...n.data, highlighted: inId || inLabel || inValue } };
      })
    );
  }, [normalizedSearch, setNodes]);

  // Fullscreen container sizing
  const containerClass = fullscreen ? "fixed inset-0 z-40" : "w-full h-full";

  // Validate connections: prevent self loops and duplicates
  const isValidConnection = useCallback(
    (conn) => {
      if (!conn?.source || !conn?.target) return false;
      if (conn.source === conn.target) return false;
      const dup = edges.some(
        (e) =>
          e.source === conn.source &&
          e.target === conn.target &&
          (conn.sourceHandle ? e.sourceHandle === conn.sourceHandle : true) &&
          (conn.targetHandle ? e.targetHandle === conn.targetHandle : true)
      );
      return !dup;
    },
    [edges]
  );

  const onConnect = useCallback(
    (params) => {
      if (!isValidConnection(params)) return;
      setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: false, style: { stroke: "#64748b", strokeWidth: 1.5 } }, eds));
      if (autoFit && rfInstance) requestAnimationFrame(() => rfInstance.fitView({ padding: 0.15 }));
    },
    [setEdges, isValidConnection, autoFit, rfInstance]
  );

  const nodeTypes = useMemo(
    () => ({
      jsonNode: (props) => <NodeCard id={props.id} data={props.data} selected={props.selected} highlighted={props.data.highlighted} />,
    }),
    []
  );

  // Auto-fit on container resize
  useEffect(() => {
    if (!autoFit || !rfInstance || !containerRef.current) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(() => rfInstance.fitView({ padding: 0.12 })));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [autoFit, rfInstance]);

  return (
    <div ref={containerRef} className={containerClass}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Strict}
        isValidConnection={isValidConnection}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        defaultEdgeOptions={{ animated: false, style: { stroke: "#94a3b8", strokeWidth: 1.5 } }}
        minZoom={0.05}
        maxZoom={2}
        panOnDrag={[2]}
        selectionOnDrag
        panOnScroll
        zoomOnDoubleClick={false}
        snapToGrid
        snapGrid={[10, 10]}
        proOptions={{ hideAttribution: true }}
        onInit={setRfInstance}
        className="bg-slate-50"
      >
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => nodeColors[n.data?.type] || "#94a3b8"}
          nodeStrokeColor={() => "#0f172a"}
          nodeStrokeWidth={1}
          maskColor="rgba(15,23,42,0.1)"
        />
        <Controls position="bottom-right" showInteractive={false} />
        <Background variant="dots" gap={18} size={2} color="#cbd5e1" />
      </ReactFlow>
    </div>
  );
};

export default TreeCanvas;
