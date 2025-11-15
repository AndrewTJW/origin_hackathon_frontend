import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function ForceGraph({ nodes, links }) {
  const svgRef = useRef();
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });
  const [zoomLevel, setZoomLevel] = useState(1);
  const simulationRef = useRef(null);

  useEffect(() => {
    if (!nodes.length) {
      console.log("No nodes to render");
      return;
    }
    console.log("Rendering graph with nodes:", nodes, "and links:", links);

    const width = 800;
    const height = 500;
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear previous graph

    // Create container group for zoom/pan transformations
    const container = svg.append("g").attr("class", "zoom-container");

    // --- Create groups ---
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    // --- Simulation ---
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20))
      .on("tick", ticked);

    simulationRef.current = simulation;

    const nodeGroup = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(drag(simulation));

    // Helper function to check if node represents a URL
    const isUrl = (d) => {
      const url = d.name || "";
      return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
    };

    // Add circles
    const node = nodeGroup.append("circle")
      .attr("r", d => isUrl(d) ? 10 : 15) // Smaller circle for URL nodes, larger for root/keyword nodes
      .attr("fill", d => isUrl(d) ? "steelblue" : "#ff6b6b")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        // Highlight on hover
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d => isUrl(d) ? 14 : 20)
          .attr("fill", d => isUrl(d) ? "#4a90e2" : "#ff4757");
        
        // Show tooltip
        setTooltip({
          show: true,
          x: event.pageX,
          y: event.pageY,
          content: d
        });
      })
      .on("mouseleave", function(event, d) {
        // Reset size
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d => isUrl(d) ? 10 : 15)
          .attr("fill", d => isUrl(d) ? "steelblue" : "#ff6b6b");
        
        // Hide tooltip
        setTooltip({ show: false, x: 0, y: 0, content: null });
      })
      .on("click", function(event, d) {
        // Open link in new tab if it's a URL
        if (isUrl(d)) {
          window.open(d.name, "_blank");
        }
      });

    // Add labels for nodes (show keyword for root nodes, truncate long URLs)
    nodeGroup.append("text")
      .text(d => {
        if (isUrl(d)) {
          // For URL nodes, show nothing or truncate if needed
          return "";
        }
        // For keyword/root nodes, show the name
        return d.name || "";
      })
      .attr("text-anchor", "middle")
      .attr("dy", 30)
      .attr("fill", "#fff")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4]) // Limit zoom between 10% and 400%
      .filter((event) => {
        // Allow zoom/pan unless we're clicking directly on a node circle
        // This allows panning on empty space and links, but prevents conflicts with node dragging
        if (event.type === "mousedown" || event.type === "touchstart") {
          const target = event.target;
          // Allow zoom if clicking on SVG background, links, or text elements
          return target === svg.node() || 
                 target.tagName === "svg" || 
                 target.tagName === "line" || 
                 target.tagName === "text" ||
                 (target.tagName === "g" && !target.querySelector("circle"));
        }
        return true; // Allow all wheel events for zooming
      })
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      })
      .on("start", () => {
        // Change cursor when starting to pan
        svg.style("cursor", "grabbing");
      })
      .on("end", () => {
        // Reset cursor when done panning
        svg.style("cursor", "grab");
      });

    // Apply zoom to SVG, but prevent zoom on node drag
    svg.call(zoom);

    // Initial zoom to fit all nodes (optional - can be enabled if needed)
    // setTimeout(() => {
    //   const bounds = container.node().getBBox();
    //   const fullWidth = bounds.width;
    //   const fullHeight = bounds.height;
    //   const midX = bounds.x + fullWidth / 2;
    //   const midY = bounds.y + fullHeight / 2;
    //   const scale = 0.8 / Math.max(fullWidth / width, fullHeight / height);
    //   const translate = [width / 2 - scale * midX, height / 2 - scale * midY];
    //   svg.transition().duration(750).call(
    //     zoom.transform,
    //     d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    //   );
    // }, 1000);

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodeGroup
        .attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function drag(simulation) {
      return d3.drag()
        .filter((event) => {
          // Only allow dragging on nodes, not on links or empty space
          return event.target.tagName === "circle" || event.target.tagName === "g";
        })
        .on("start", function(event) {
          // Stop zoom/pan when dragging nodes
          event.sourceEvent.stopPropagation();
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
          d3.select(this).style("cursor", "grabbing");
        })
        .on("drag", function(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", function(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
          d3.select(this).style("cursor", "pointer");
        });
    }

    // Store zoom instance for external controls
    containerRef.current = { zoom, svg };

  }, [nodes, links]);

  // Zoom control functions
  const handleZoomIn = () => {
    if (containerRef.current) {
      const { svg, zoom } = containerRef.current;
      svg.transition().call(zoom.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (containerRef.current) {
      const { svg, zoom } = containerRef.current;
      svg.transition().call(zoom.scaleBy, 1 / 1.5);
    }
  };

  const handleResetZoom = () => {
    if (containerRef.current) {
      const { svg, zoom } = containerRef.current;
      svg.transition().call(zoom.transform, d3.zoomIdentity);
      setZoomLevel(1);
    }
  };

  const handleFitToView = () => {
    if (containerRef.current && nodes.length > 0 && simulationRef.current) {
      const { svg, zoom } = containerRef.current;
      
      // Wait for simulation to stabilize to get accurate node positions
      setTimeout(() => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
          if (node.x !== undefined && node.y !== undefined) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
          }
        });

        if (minX === Infinity) return;

        const width = 800;
        const height = 500;
        const padding = 50;

        const graphWidth = maxX - minX || 100;
        const graphHeight = maxY - minY || 100;
        const scale = Math.min(
          (width - 2 * padding) / graphWidth,
          (height - 2 * padding) / graphHeight,
          1
        );

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const translateX = width / 2 - scale * centerX;
        const translateY = height / 2 - scale * centerY;

        svg.transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }, 100);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
      {/* Zoom Controls */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          background: "rgba(0, 0, 0, 0.7)",
          padding: "8px",
          borderRadius: "8px",
          backdropFilter: "blur(4px)",
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#2563eb")}
          onMouseOut={(e) => (e.target.style.background = "#3b82f6")}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#2563eb")}
          onMouseOut={(e) => (e.target.style.background = "#3b82f6")}
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          style={{
            background: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "12px",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#4b5563")}
          onMouseOut={(e) => (e.target.style.background = "#6b7280")}
          title="Reset Zoom"
        >
          Reset
        </button>
        <button
          onClick={handleFitToView}
          style={{
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "11px",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#059669")}
          onMouseOut={(e) => (e.target.style.background = "#10b981")}
          title="Fit to View"
        >
          Fit
        </button>
        <div
          style={{
            color: "white",
            fontSize: "11px",
            textAlign: "center",
            paddingTop: "4px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            marginTop: "4px",
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          zIndex: 10,
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          backdropFilter: "blur(4px)",
        }}
      >
        <div>🖱️ Scroll to zoom • 🖱️ Drag to pan • 🖱️ Drag nodes to move</div>
      </div>

      <svg
        ref={svgRef}
        width={800}
        height={500}
        style={{ 
          border: "1px solid #ccc", 
          borderRadius: "8px",
          cursor: "grab",
        }}
      ></svg>
      
      {tooltip.show && tooltip.content && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            background: "rgba(0, 0, 0, 0.9)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 1000,
            maxWidth: "300px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)"
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "14px" }}>
            {tooltip.content.name}
          </div>
          {tooltip.content.name && (tooltip.content.name.startsWith("http://") || tooltip.content.name.startsWith("https://")) && (
            <div style={{ fontSize: "12px", color: "#4a90e2", wordBreak: "break-all" }}>
              🔗 {tooltip.content.name}
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#aaa" }}>
                Click to open in new tab
              </div>
            </div>
          )}
          {tooltip.content.name && !tooltip.content.name.startsWith("http://") && !tooltip.content.name.startsWith("https://") && (
            <div style={{ fontSize: "12px", color: "#ffa502" }}>
              🔍 Keyword/Root Node (ID: {tooltip.content.id})
            </div>
          )}
        </div>
      )}
    </div>
  );
}
