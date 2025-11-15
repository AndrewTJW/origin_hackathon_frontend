import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "/world-110m.json";

export default function HeatmapAPI({ keyword }) {
  const [data, setData] = useState([]);
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    country: "",
    score: 0,
  });

  useEffect(() => {
    if (!keyword) return;

    fetch(`http://localhost:8000/map/search?keyword=${keyword}`)
      .then((res) => res.json())
      .then((json) => setData(json.results));
  }, [keyword]);

  const colorScale = scaleLinear()
    .domain([0, 100])
    .range(["#ffe5e5", "#ff0000"]);

  // Helper function to find country data (handles name variations)
  const findCountryData = (countryName) => {
    if (!countryName || !data.length) return null;
    
    // Try exact match first
    let entry = data.find((c) => c.country === countryName);
    
    // If no exact match, try case-insensitive match
    if (!entry) {
      entry = data.find((c) => c.country.toLowerCase() === countryName.toLowerCase());
    }
    
    // Handle common name variations (e.g., "United States of America" vs "United States")
    if (!entry) {
      const normalizedName = countryName.toLowerCase();
      if (normalizedName.includes("united states")) {
        entry = data.find((c) => c.country.toLowerCase().includes("united states"));
      } else if (normalizedName.includes("russia")) {
        entry = data.find((c) => c.country.toLowerCase().includes("russia"));
      } else if (normalizedName.includes("korea")) {
        entry = data.find((c) => c.country.toLowerCase().includes("korea"));
      }
    }
    
    return entry;
  };

  const handleMouseEnter = (event, geo) => {
    const countryName = geo.properties.name;
    const entry = findCountryData(countryName);
    const score = entry ? entry.score : 0;

    setTooltip({
      show: true,
      x: event.clientX,
      y: event.clientY,
      country: countryName,
      score: score,
    });
  };

  const handleMouseMove = (event) => {
    if (tooltip.show) {
      setTooltip((prev) => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip({
      show: false,
      x: 0,
      y: 0,
      country: "",
      score: 0,
    });
  };

  return (
    <div 
      style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        position: "relative"
      }}
      onMouseMove={handleMouseMove}
    >
      <ComposableMap 
        projectionConfig={{ scale: 150 }}
        width={800}
        height={400}
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name;
              const entry = findCountryData(name);
              const score = entry ? entry.score : 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorScale(score)}
                  style={{
                    outline: "none",
                    cursor: "pointer",
                    transition: "fill 0.2s ease",
                  }}
                  onMouseEnter={(event) => handleMouseEnter(event, geo)}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 15,
            top: tooltip.y - 15,
            background: "rgba(0, 0, 0, 0.9)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            fontSize: "14px",
            maxWidth: "250px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "16px" }}>
            {tooltip.country}
          </div>
          <div style={{ fontSize: "13px", color: "#9ca3af" }}>
            Score: <span style={{ color: "#fff", fontWeight: "600" }}>{tooltip.score}</span>
          </div>
        </div>
      )}
    </div>
  );
}
