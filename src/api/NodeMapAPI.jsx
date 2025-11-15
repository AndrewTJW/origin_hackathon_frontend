// NodeMapAPI.jsx
import { useEffect, useState } from "react";
import ForceGraph from "../components/tabs/ForceGraph";

// Helper: build graph nodes/links from our logical nodeList
function buildGraph(nodeList) {
  const nodes = nodeList.map((n) => ({
    id: n.id, // can be number or string
    name: n.url, // label shown in graph (change if you want)
  }));

  const links = nodeList
    .filter((n) => n.parentId !== null)
    .map((n) => ({
      source: n.parentId,
      target: n.id,
    }));

  return { nodes, links };
}

// Call your FastAPI backend and return an array of URLs
async function searchUrlsFrom(keyword, fromUrl = null) {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/search?keyword=${encodeURIComponent(keyword)}`
    );
    const data = await res.json();

    // Adjust based on your backend response
    // If backend returns { urls: ["..",".."] }
    if (Array.isArray(data.urls)) return data.urls;

    // If using { results: [{url: "..."}] } shape:
    if (Array.isArray(data.results)) {
      return data.results.map((r) => r.url || r.url_user || r.url_main);
    }

    // If backend directly returns an array of URLs
    if (Array.isArray(data)) {
      return data.map((item) => typeof item === 'string' ? item : (item.url || item.url_user || item.url_main));
    }

    return [];
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}

export default function NodeMapAPI({ searchKeyword, searchSignal }) {
  const [nodeList, setNodeList] = useState([]); // {id, url, parentId}[]
  const [nodes, setNodes] = useState([]); // for ForceGraph
  const [links, setLinks] = useState([]); // for ForceGraph

  // Rebuild graph whenever nodeList changes
  useEffect(() => {
    const { nodes: graphNodes, links: graphLinks } = buildGraph(nodeList);
    setNodes(graphNodes);
    setLinks(graphLinks);
  }, [nodeList]);

  // Core branching logic
  const runSearch = async (rawKeyword) => {
    const trimmed = (rawKeyword || "").trim();
    if (!trimmed) return;

    // No nodes yet → create root + first generation
    if (nodeList.length === 0) {
      // Create root node with keyword as URL value, id=1, parentId=null
      const root = {
        id: 1,
        url: trimmed, // Root node has the keyword as its URL value
        parentId: null,
      };

      // Fetch results from backend
      const resultUrls = await searchUrlsFrom(trimmed, null);

      // Create child nodes with sequential IDs starting from 2
      // Each result gets id based on search ranking (2, 3, 4, ...)
      let nextId = 2;
      const children = resultUrls.map((url) => ({
        id: nextId++,
        url,
        parentId: root.id, // All children have parentId = 1
      }));

      // Store root and children in the list
      setNodeList([root, ...children]);
    } else {
      // Subsequent search → check every URL in the list and branch if keyword is present
      const matches = nodeList.filter((n) => {
        // Check if keyword exists in the URL (case-insensitive)
        return n.url && n.url.toLowerCase().includes(trimmed.toLowerCase());
      });

      if (matches.length === 0) {
        console.log("No nodes matched this keyword, nothing to branch.");
        return;
      }

      // Calculate next available ID
      const maxId = nodeList.reduce((max, n) => Math.max(max, n.id), 0);
      let nextId = maxId + 1;
      const newNodes = [];

      // For each matching parent node, create branches
      for (const parent of matches) {
        const resultUrls = await searchUrlsFrom(trimmed, parent.url);
        for (const url of resultUrls) {
          newNodes.push({
            id: nextId++,
            url,
            parentId: parent.id, // New node is a child of the matching parent
          });
        }
      }

      // Append new nodes to existing list
      setNodeList((prev) => [...prev, ...newNodes]);
    }
  };

  // 🔔 Whenever blue button is clicked, searchSignal increments in App,
  // this effect runs, and we branch using the current searchKeyword.
  useEffect(() => {
    if (searchSignal === 0) return; // optional: ignore initial mount
    if (!searchKeyword) return; // nothing to search
    runSearch(searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchSignal]);

  return (
    <div>
      <h1>Network Graph</h1>
      <ForceGraph nodes={nodes} links={links} />
    </div>
  );
}
