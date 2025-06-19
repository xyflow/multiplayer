import { useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  type OnConnect,
} from "@xyflow/react";

const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Hello" },
  },
  {
    id: "2",
    position: { x: 300, y: 0 },
    data: { label: "World" },
  },
];

const initialEdges = [
  {
    id: "1->2",
    source: "1",
    target: "2",
    type: "smoothstep",
  },
];

export function Flow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      minZoom={0}
    >
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  );
}
