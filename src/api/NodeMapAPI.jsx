// NodeMapAPI.jsx
import { useEffect, useState } from "react";
import ForceGraph from "../components/tabs/ForceGraph";

// Helper: build graph nodes/links from our logical nodeList
function buildGraph(nodeList) {
  const nodes = nodeList.map((n) => ({
    id: n.id,            // can be number or string
    name: n.url,         // label shown in graph (change if you want)
  }));

  const links = nodeList
    .filter((n) => n.parentId !== null)
    .map((n) => ({
      source: n.parentId,
      target: n.id,
    }));

  return { nodes, links };
}

// Call your FastAPI backend and return data based on search mode
async function searchUrlsFrom(keyword, searchMode = "Keyword") {
  try {
    let url = "";

    if (searchMode === "Username") {
      url = `http://127.0.0.1:8000/maigret/search?username=${encodeURIComponent(
        keyword
      )}`;
    } else if (searchMode === "Email") {
      url = `http://127.0.0.1:8000/api/check-email?email=${encodeURIComponent(
        keyword
      )}`;
    } else {
      // Default: Keyword search
      url = `http://127.0.0.1:8000/search?keyword=${encodeURIComponent(
        keyword
      )}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    // Username / Email → return full object
    if (searchMode === "Username" || searchMode === "Email") {
      return data;
    }

    // Keyword → return array of URLs
    if (Array.isArray(data.urls)) return data.urls;

    if (Array.isArray(data.results)) {
      return data.results.map((r) => r.url || r.url_user || r.url_main);
    }

    if (Array.isArray(data)) {
      return data.map((item) =>
        typeof item === "string"
          ? item
          : item.url || item.url_user || item.url_main
      );
    }

    return [];
  } catch (error) {
    console.error(`Error fetching ${searchMode} search results:`, error);
    return searchMode === "Username" || searchMode === "Email" ? null : [];
  }
}

// Helper function to convert nodeList to CSV
function convertNodesToCSV(nodeList) {
  if (nodeList.length === 0) {
    return "id,url,parentId\n";
  }

  const header = "id,url,parentId\n";

  const rows = nodeList
    .map((node) => {
      const id = node.id ?? "";
      const url = node.url ?? "";
      const parentId = node.parentId === null ? "" : node.parentId;

      // Escape commas and quotes in URL
      const escapedUrl =
        url.includes(",") || url.includes('"')
          ? `"${url.replace(/"/g, '""')}"`
          : url;

      return `${id},${escapedUrl},${parentId}`;
    })
    .join("\n");

  return header + rows;
}

// Helper function to download CSV file
function downloadCSV(csvContent, filename = "node_map.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function NodeMapAPI({
  searchKeyword,
  searchSignal,
  searchMode = "Keyword",
  onDownloadReady,
}) {
  const [nodeList, setNodeList] = useState([]); // {id, url, parentId}[]
  const [nodes, setNodes] = useState([]);       // for ForceGraph
  const [links, setLinks] = useState([]);       // for ForceGraph
  const [isLoading, setIsLoading] = useState(false);

  // Rebuild graph whenever nodeList changes
  useEffect(() => {
    const { nodes: graphNodes, links: graphLinks } = buildGraph(nodeList);
    setNodes(graphNodes);
    setLinks(graphLinks);
  }, [nodeList]);

  // Expose download function to parent component
  useEffect(() => {
    if (!onDownloadReady) return;

    const handleDownload = () => {
      if (nodeList.length === 0) {
        alert("No nodes to download. Please perform a search first.");
        return;
      }

      const csvContent = convertNodesToCSV(nodeList);
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `node_map_${timestamp}.csv`;
      downloadCSV(csvContent, filename);
    };

    // Parent will store this function and call it only on "Download" click
    onDownloadReady(handleDownload);
  }, [nodeList, onDownloadReady]);

  // --- EMAIL MODE HANDLER ---
  const handleEmailSearch = async (emailKeyword) => {
    const emailData = await searchUrlsFrom(emailKeyword, "Email");
    if (!emailData || !emailData.email) {
      console.log("No email data from backend, creating simple root only.");
      const maxId = nodeList.reduce((max, n) => Math.max(max, n.id), 0);
      const newRoot = {
        id: maxId + 1 || 1,
        url: emailKeyword,
        parentId: null,
      };
      setNodeList((prev) => [...prev, newRoot]);
      return;
    }

    const email = emailData.email.trim();
    const platforms = Array.isArray(emailData.platforms_found)
      ? emailData.platforms_found
      : [];

    // Find existing root for this email (if any)
    const existingRoot = nodeList.find(
      (n) =>
        n.parentId === null &&
        typeof n.url === "string" &&
        n.url.toLowerCase() === email.toLowerCase()
    );

    // Compute next ID
    const maxId = nodeList.reduce((max, n) => Math.max(max, n.id), 0);
    let nextId = maxId + 1 || 1;

    let rootId;
    let updatedList = nodeList;

    if (existingRoot) {
      // Reuse existing root, remove its old children (so platforms always remain children)
      rootId = existingRoot.id;
      updatedList = nodeList.filter((n) => n.parentId !== rootId);
    } else {
      // Create a new root for this email
      rootId = nextId++;
      const newRoot = {
        id: rootId,
        url: email, // parent node is the email itself
        parentId: null,
      };
      updatedList = [...nodeList, newRoot];
    }

    // Track URLs to avoid duplicates across the whole graph
    const existingUrls = new Set(
      updatedList
        .filter((n) => typeof n.url === "string")
        .map((n) => n.url.toLowerCase())
    );

    const children = [];
    for (const platform of platforms) {
      if (!platform || !platform.trim()) continue;
      const platformUrl = platform.trim();
      const lower = platformUrl.toLowerCase();

      if (existingUrls.has(lower)) {
        console.log(`Skipping duplicate platform: ${platformUrl}`);
        continue;
      }

      existingUrls.add(lower);
      children.push({
        id: nextId++,
        url: platformUrl,   // child node is the platform (office365.com, etc.)
        parentId: rootId,   // always child of the email root
      });
    }

    setNodeList([...updatedList, ...children]);
    console.log(
      `Email root "${email}" now has ${children.length} platform children`
    );
  };

  // --- USERNAME & KEYWORD MODES (your original branching logic, simplified a bit) ---
  const handleFirstSearchForNonEmail = async (trimmed) => {
    if (searchMode === "Username") {
      const usernameData = await searchUrlsFrom(trimmed, "Username");
      if (!usernameData || !usernameData.username) {
        const root = { id: 1, url: trimmed, parentId: null };
        setNodeList([root]);
        return;
      }

      const root = {
        id: 1,
        url: usernameData.username,
        parentId: null,
      };

      let nextId = 2;
      const children = [];
      const existing = new Set();

      if (Array.isArray(usernameData.sites_found)) {
        for (const site of usernameData.sites_found) {
          const siteUrl = site.url_user || site.url_main;
          if (!siteUrl || !siteUrl.trim()) continue;

          const lower = siteUrl.toLowerCase();
          if (existing.has(lower)) continue;
          existing.add(lower);

          children.push({
            id: nextId++,
            url: siteUrl.trim(),
            parentId: root.id,
          });
        }
      }

      setNodeList([root, ...children]);
      console.log(
        `Username root "${usernameData.username}" with ${children.length} site nodes`
      );
    } else {
      // Keyword search
      const root = {
        id: 1,
        url: trimmed,
        parentId: null,
      };

      const resultUrls = await searchUrlsFrom(trimmed, "Keyword");

      if (!resultUrls || !Array.isArray(resultUrls) || resultUrls.length === 0) {
        setNodeList([root]);
        return;
      }

      let nextId = 2;
      const children = resultUrls
        .filter((url) => url && url.trim() !== "")
        .map((url) => ({
          id: nextId++,
          url: url.trim(),
          parentId: root.id,
        }));

      setNodeList([root, ...children]);
    }
  };

  const handleSubsequentSearchForNonEmail = async (trimmed) => {
    const trimmedLower = trimmed.toLowerCase();

    // Find URLs that contain the keyword (case-insensitive)
    const matches = nodeList.filter(
      (n) =>
        typeof n.url === "string" && n.url.toLowerCase().includes(trimmedLower)
    );

    const maxId = nodeList.reduce((max, n) => Math.max(max, n.id), 0);
    let nextId = maxId + 1 || 1;

    // If no matches, create new root + children (same behaviour as before)
    if (matches.length === 0) {
      console.log("No nodes matched keyword. Creating new root for:", trimmed);

      // Avoid duplicate root with same keyword
      const existingRootSameKeyword = nodeList.some(
        (n) =>
          n.parentId === null &&
          typeof n.url === "string" &&
          n.url.toLowerCase() === trimmedLower
      );
      if (existingRootSameKeyword) {
        console.log(
          `Root node with keyword "${trimmed}" already exists. Skipping duplicate root.`
        );
        return;
      }

      const resultData = await searchUrlsFrom(trimmed, searchMode);

      let resultUrls = [];
      if (searchMode === "Username" && resultData && resultData.sites_found) {
        resultUrls = resultData.sites_found
          .map((site) => site.url_user || site.url_main)
          .filter(Boolean);
      } else if (
        searchMode === "Keyword" &&
        Array.isArray(resultData)
      ) {
        resultUrls = resultData;
      }

      const existingUrls = new Set(
        nodeList
          .filter((n) => typeof n.url === "string")
          .map((n) => n.url.toLowerCase())
      );

      const newRoot = {
        id: nextId++,
        url: trimmed,
        parentId: null,
      };

      const children = [];
      for (const url of resultUrls) {
        if (!url || !url.trim()) continue;
        const lower = url.toLowerCase();
        if (existingUrls.has(lower)) continue;
        existingUrls.add(lower);

        children.push({
          id: nextId++,
          url: url.trim(),
          parentId: newRoot.id,
        });
      }

      setNodeList((prev) => [...prev, newRoot, ...children]);
      return;
    }

    // Matches found → branch from each matching node
    const existingUrls = new Set(
      nodeList
        .filter((n) => typeof n.url === "string")
        .map((n) => n.url.toLowerCase())
    );
    const newNodes = [];

    for (const parent of matches) {
      const resultData = await searchUrlsFrom(trimmed, searchMode);
      let resultUrls = [];

      if (searchMode === "Username" && resultData && resultData.sites_found) {
        resultUrls = resultData.sites_found
          .map((site) => site.url_user || site.url_main)
          .filter(Boolean);
      } else if (
        searchMode === "Keyword" &&
        Array.isArray(resultData)
      ) {
        resultUrls = resultData;
      }

      for (const url of resultUrls) {
        if (!url || !url.trim()) continue;
        const lower = url.toLowerCase();
        if (existingUrls.has(lower)) {
          console.log(`Skipping duplicate URL: ${url}`);
          continue;
        }
        existingUrls.add(lower);

        newNodes.push({
          id: nextId++,
          url: url.trim(),
          parentId: parent.id,
        });
      }
    }

    if (newNodes.length > 0) {
      setNodeList((prev) => [...prev, ...newNodes]);
    } else {
      console.log("All URLs from search already exist in the node tree");
    }
  };

  // Core search dispatcher
  const runSearch = async (rawKeyword) => {
    const trimmed = (rawKeyword || "").trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      // Special handling for Email:
      if (searchMode === "Email") {
        await handleEmailSearch(trimmed);
        return;
      }

      // Username / Keyword:
      if (nodeList.length === 0) {
        await handleFirstSearchForNonEmail(trimmed);
      } else {
        await handleSubsequentSearchForNonEmail(trimmed);
      }
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔔 Whenever blue button is clicked, searchSignal increments in App,
  // this effect runs, and we branch using the current searchKeyword.
  useEffect(() => {
    if (searchSignal === 0) return; // ignore initial mount
    if (!searchKeyword) return;
    runSearch(searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchSignal]);

  return (
    <div style={{ position: "relative" }}>
      <h1>Network Graph</h1>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            minHeight: "400px",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #3b82f6",
              borderTop: "4px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ marginTop: "20px", color: "#9ca3af", fontSize: "16px" }}>
            Loading data from endpoint...
          </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      ) : (
        <ForceGraph nodes={nodes} links={links} />
      )}
    </div>
  );
}
