import React from "react";
import NodeAPI from "../../api/NodeMapAPI";


function NodeMapContent({ searchKeyword, searchSignal, searchMode, onDownloadReady }) {
  return (
    <div className="p-8">
      <NodeAPI 
        searchKeyword={searchKeyword} 
        searchSignal={searchSignal}
        searchMode={searchMode}
        onDownloadReady={onDownloadReady}
      />
    </div>
  );
}

export default NodeMapContent;
