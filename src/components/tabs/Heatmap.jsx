import React from "react";
import HeatmapAPI from "../../api/HeatmapAPI";

const HeatMapContent = ({ keyword }) => (
  <div className="p-8 text-center text-gray-400 h-[50vh] flex items-center justify-center">
    <HeatmapAPI keyword={keyword} />
  </div>
);

export default HeatMapContent;
