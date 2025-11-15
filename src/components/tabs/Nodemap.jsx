import React from "react";
import ForceGraph from "./ForceGraph";
import NodeAPI from "../../api/NodeMapAPI";


function NodeMapContent() {
  return (
    <div className="p-8">
      <NodeAPI />
    </div>
  );
}

export default NodeMapContent;
