import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function ForceGraph({ nodes, links }) {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });

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

    // --- Create groups ---
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    // --- Simulation ---
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    const nodeGroup = svg.append("g")
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
      .style("cursor", d => isUrl(d) ? "pointer" : "default")
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
        .on("start", event => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", event => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", event => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    }

  }, [nodes, links]);

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
      <svg
        ref={svgRef}
        width={800}
        height={500}
        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
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
