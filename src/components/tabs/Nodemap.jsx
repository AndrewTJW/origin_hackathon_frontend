import React from "react";
import NodeAPI from "../../api/NodeMapAPI";


function NodeMapContent({ searchKeyword, searchSignal }) {
  return (
    <div className="p-8">
      <NodeAPI searchKeyword={searchKeyword} searchSignal={searchSignal} />
    </div>
  );
}

export default NodeMapContent;
