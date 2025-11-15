import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "/world-110m.json";

export default function Heatmap({ keyword }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!keyword) return;

    fetch(`http://localhost:8000/search?keyword=${keyword}`)
      .then((res) => res.json())
      .then((json) => setData(json.results));
  }, [keyword]);

  const colorScale = scaleLinear()
    .domain([0, 100])
    .range(["#ffe5e5", "#ff0000"]);

  return (
    <div style={{ width: "100%", marginTop: 20 }}>
      <ComposableMap projectionConfig={{ scale: 150 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name;
              const entry = data.find((c) => c.country === name);
              const score = entry ? entry.score : 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorScale(score)}
                  style={{ outline: "none" }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
