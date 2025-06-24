import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  useReactFlow,
  type XYPosition,
} from "@xyflow/react";

export function Flow({
  nodes,
  edges,
  createNodeAt,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: {
  nodes: Node[];
  edges: Edge[];
  createNodeAt: (position: XYPosition) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
}) {
  const { screenToFlowPosition } = useReactFlow();
  // const [nodes, , onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  // const onConnect: OnConnect = useCallback(
  //   (params) => setEdges((els) => addEdge(params, els)),
  //   [setEdges]
  // );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onContextMenu={(e) => {
        e.preventDefault();
        createNodeAt(screenToFlowPosition({ x: e.clientX, y: e.clientY }));
      }}
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
