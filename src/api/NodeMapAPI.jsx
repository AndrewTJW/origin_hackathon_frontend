// NodeMapAPI.jsx
import { useEffect, useState, useRef } from "react";
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

// Call your FastAPI backend and return data based on search mode
// For username searches, returns full response object. For others, returns array of URLs.
async function searchUrlsFrom(keyword, searchMode = "Keyword", fromUrl = null) {
  try {
    let url = "";
    
    // Select the correct endpoint based on search mode
    if (searchMode === "Username") {
      url = `http://127.0.0.1:8000/maigret/search?username=${encodeURIComponent(keyword)}`;
    } else if (searchMode === "Email") {
      url = `http://127.0.0.1:8000/api/check-email?email=${encodeURIComponent(keyword)}`;
    } else {
      // Default: Keyword search
      url = `http://127.0.0.1:8000/search?keyword=${encodeURIComponent(keyword)}`;
    }
    
    const res = await fetch(url);
    const data = await res.json();

    // For username and email searches, return the full response object (not just URLs)
    // This allows us to access email/username and platforms_found/sites_found separately
    if (searchMode === "Username") {
      return data; // Return full response: { username: "...", sites_found: [...] }
    }
    
    if (searchMode === "Email") {
      return data; // Return full response: { email: "...", platforms_found: [...] }
    }

    // For other search modes (Keyword), return array of URLs
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
    console.error(`Error fetching ${searchMode} search results:`, error);
    return (searchMode === "Username" || searchMode === "Email") ? null : [];
  }
}

// Helper function to convert nodeList to CSV
function convertNodesToCSV(nodeList) {
  if (nodeList.length === 0) {
    return "id,url,parentId\n";
  }

  // CSV header
  const header = "id,url,parentId\n";
  
  // CSV rows - handle null parentId as empty string or "null"
  const rows = nodeList.map((node) => {
    const id = node.id || "";
    const url = node.url || "";
    const parentId = node.parentId === null ? "" : node.parentId;
    
    // Escape commas and quotes in URL
    const escapedUrl = url.includes(',') || url.includes('"') 
      ? `"${url.replace(/"/g, '""')}"` 
      : url;
    
    return `${id},${escapedUrl},${parentId}`;
  }).join("\n");

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
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

export default function NodeMapAPI({ searchKeyword, searchSignal, searchMode = "Keyword", onDownloadReady }) {
  const [nodeList, setNodeList] = useState([]); // {id, url, parentId}[]
  const [nodes, setNodes] = useState([]); // for ForceGraph
  const [links, setLinks] = useState([]); // for ForceGraph
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls
  const prevNodeListLengthRef = useRef(0); // Track nodeList length to prevent spam

  // Rebuild graph whenever nodeList changes
  useEffect(() => {
    const { nodes: graphNodes, links: graphLinks } = buildGraph(nodeList);
    setNodes(graphNodes);
    setLinks(graphLinks);
  }, [nodeList]);

  // Expose download function to parent component
  // Only update when nodeList length actually changes to prevent spam
  useEffect(() => {
    if (!onDownloadReady) return;
    
    // Only proceed if nodeList length changed or it's initial mount
    if (prevNodeListLengthRef.current === nodeList.length && prevNodeListLengthRef.current !== 0) {
      return; // Skip if nothing changed
    }
    
    const handleDownload = () => {
      if (nodeList.length === 0) {
        return; // Silently return if no nodes (no popup)
      }
      const csvContent = convertNodesToCSV(nodeList);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const filename = `node_map_${timestamp}.csv`;
      downloadCSV(csvContent, filename);
      alert("CSV file downloaded"); // Show success message
    };
    
    // Update the callback only when nodeList actually changes
    onDownloadReady(handleDownload);
    prevNodeListLengthRef.current = nodeList.length;
  }, [nodeList, onDownloadReady]);

  // Core branching logic
  const runSearch = async (rawKeyword) => {
    const trimmed = (rawKeyword || "").trim();
    if (!trimmed) return;

    // Set loading state to true when starting search
    setIsLoading(true);

    try {
      // No nodes yet → create root + first generation
      if (nodeList.length === 0) {
        // Handle username search differently - username as root, sites as children
        if (searchMode === "Username") {
          // Fetch full username data from backend
          const usernameData = await searchUrlsFrom(trimmed, searchMode, null);
          
          if (!usernameData || !usernameData.username) {
            console.log("Backend returned no username data. Creating root node only.");
            const root = {
              id: 1,
              url: trimmed,
              parentId: null,
            };
            setNodeList([root]);
            return;
          }

          // Create root node with username
          const root = {
            id: 1,
            url: usernameData.username, // Use the username from response as root
            parentId: null,
          };

          // Create child nodes for each site found
          let nextId = 2;
          const children = [];
          
          if (Array.isArray(usernameData.sites_found) && usernameData.sites_found.length > 0) {
            const existingUrls = new Set(); // Track to prevent duplicates
            
            for (const site of usernameData.sites_found) {
              // Use url_user as the primary URL, fallback to url_main
              const siteUrl = site.url_user || site.url_main;
              
              if (!siteUrl || !siteUrl.trim()) continue;
              
              const urlLower = siteUrl.toLowerCase();
              if (existingUrls.has(urlLower)) {
                console.log(`Skipping duplicate site URL: ${siteUrl}`);
                continue;
              }
              
              existingUrls.add(urlLower);
              children.push({
                id: nextId++,
                url: siteUrl.trim(),
                parentId: root.id, // All children linked to username root
              });
            }
          }

          // Store root and children
          setNodeList([root, ...children]);
          console.log(`Created username root "${usernameData.username}" with ${children.length} site nodes`);
        } else if (searchMode === "Email") {
          // Handle email search - email as root, platforms as children
          // Fetch full email data from backend
          const emailData = await searchUrlsFrom(trimmed, searchMode, null);
          
          if (!emailData || !emailData.email) {
            console.log("Backend returned no email data. Creating root node only.");
            const root = {
              id: 1,
              url: trimmed,
              parentId: null,
            };
            setNodeList([root]);
            return;
          }

          // Create root node with email
          const root = {
            id: 1,
            url: emailData.email, // Use the email from response as root
            parentId: null,
          };

          // Create child nodes for each platform found
          let nextId = 2;
          const children = [];
          
          if (Array.isArray(emailData.platforms_found) && emailData.platforms_found.length > 0) {
            const existingUrls = new Set(); // Track to prevent duplicates
            
            for (const platform of emailData.platforms_found) {
              if (!platform || !platform.trim()) continue;
              
              // Use platform name as URL (you might want to format it as a URL later)
              const platformUrl = platform.trim();
              
              const urlLower = platformUrl.toLowerCase();
              if (existingUrls.has(urlLower)) {
                console.log(`Skipping duplicate platform: ${platformUrl}`);
                continue;
              }
              
              existingUrls.add(urlLower);
              children.push({
                id: nextId++,
                url: platformUrl,
                parentId: root.id, // All children linked to email root
              });
            }
          }

          // Store root and children
          setNodeList([root, ...children]);
          console.log(`Created email root "${emailData.email}" with ${children.length} platform nodes`);
        } else {
          // For Keyword searches, use existing logic
          // Create root node with keyword as URL value, id=1, parentId=null
          const root = {
            id: 1,
            url: trimmed, // Root node has the keyword as its URL value
            parentId: null,
          };

          // Fetch results from backend using the appropriate endpoint based on searchMode
          const resultUrls = await searchUrlsFrom(trimmed, searchMode, null);

          // If backend returns empty or fails, still create the root but with no children
          if (!resultUrls || !Array.isArray(resultUrls) || resultUrls.length === 0) {
            console.log("Backend returned no results for initial search. Creating root node only.");
            setNodeList([root]);
            return;
          }

          // Create child nodes with sequential IDs starting from 2
          // Each result gets id based on search ranking (2, 3, 4, ...)
          let nextId = 2;
          const children = resultUrls
            .filter((url) => url && url.trim() !== "") // Filter out empty URLs
            .map((url) => ({
              id: nextId++,
              url: url.trim(),
              parentId: root.id, // All children have parentId = 1
            }));

          // Store root and children in the list
          setNodeList([root, ...children]);
        }
      } else {
        // Subsequent search → check every URL in the list and branch if keyword is present
        const matches = nodeList.filter((n) => {
          // Check if keyword exists in the URL (case-insensitive)
          return n.url && n.url.toLowerCase().includes(trimmed.toLowerCase());
        });

        // Calculate next available ID
        const maxId = nodeList.reduce((max, n) => Math.max(max, n.id), 0);
        let nextId = maxId + 1;
        const newNodes = [];

        if (matches.length === 0) {
          // No matches found → create a new root/parent node for this unrelated keyword
          // First check if a root node with this exact keyword already exists
          const existingRoots = nodeList.filter(n => n.parentId === null);
          const keywordAlreadyExists = existingRoots.some(n => 
            n.url.toLowerCase() === trimmed.toLowerCase()
          );
          
          if (keywordAlreadyExists) {
            console.log(`Root node with keyword "${trimmed}" already exists. Skipping duplicate root.`);
            return; // Don't create duplicate root node
          }
          
          console.log("No nodes matched this keyword. Creating new root node for:", trimmed);
          
          // Handle username search differently when creating new root
          if (searchMode === "Username") {
            // Fetch full username data from backend
            const usernameData = await searchUrlsFrom(trimmed, searchMode, null);
            
            if (!usernameData || !usernameData.username) {
              console.log("Backend returned no username data. Creating root node only.");
              const newRoot = {
                id: nextId++,
                url: trimmed,
                parentId: null,
              };
              setNodeList((prev) => [...prev, newRoot]);
              return;
            }

            // Check for duplicates against existing nodes
            const existingUrls = new Set(nodeList.map(n => n.url.toLowerCase()));

            // Create root node with username from response
            const newRoot = {
              id: nextId++,
              url: usernameData.username,
              parentId: null,
            };

            // Create child nodes for each site found
            const children = [];
            if (Array.isArray(usernameData.sites_found) && usernameData.sites_found.length > 0) {
              for (const site of usernameData.sites_found) {
                const siteUrl = site.url_user || site.url_main;
                
                if (!siteUrl || !siteUrl.trim()) continue;
                
                const urlLower = siteUrl.toLowerCase();
                // Skip if URL already exists in nodeList (avoid duplicates)
                if (existingUrls.has(urlLower)) {
                  console.log(`Skipping duplicate URL when creating new username root: ${siteUrl}`);
                  continue;
                }
                
                existingUrls.add(urlLower);
                children.push({
                  id: nextId++,
                  url: siteUrl.trim(),
                  parentId: newRoot.id,
                });
              }
            }

          // Append new root and its children to the existing list
          setNodeList((prev) => [...prev, newRoot, ...children]);
          console.log(`Created new username root "${usernameData.username}" with ${children.length} site nodes`);
        } else if (searchMode === "Email") {
          // Handle email search differently when creating new root
          // Fetch full email data from backend
          const emailData = await searchUrlsFrom(trimmed, searchMode, null);
          
          if (!emailData || !emailData.email) {
            console.log("Backend returned no email data. Creating root node only.");
            const newRoot = {
              id: nextId++,
              url: trimmed,
              parentId: null,
            };
            setNodeList((prev) => [...prev, newRoot]);
            return;
          }

          // Check for duplicates against existing nodes
          const existingUrls = new Set(nodeList.map(n => n.url.toLowerCase()));

          // Create root node with email from response
          const newRoot = {
            id: nextId++,
            url: emailData.email,
            parentId: null,
          };

          // Create child nodes for each platform found
          const children = [];
          if (Array.isArray(emailData.platforms_found) && emailData.platforms_found.length > 0) {
            for (const platform of emailData.platforms_found) {
              if (!platform || !platform.trim()) continue;
              
              const platformUrl = platform.trim();
              const urlLower = platformUrl.toLowerCase();
              
              // Skip if URL already exists in nodeList (avoid duplicates)
              if (existingUrls.has(urlLower)) {
                console.log(`Skipping duplicate platform when creating new email root: ${platformUrl}`);
                continue;
              }
              
              existingUrls.add(urlLower);
              children.push({
                id: nextId++,
                url: platformUrl,
                parentId: newRoot.id,
              });
            }
          }

          // Append new root and its children to the existing list
          setNodeList((prev) => [...prev, newRoot, ...children]);
          console.log(`Created new email root "${emailData.email}" with ${children.length} platform nodes`);
        } else {
          // For Keyword searches, use existing logic
          // Fetch results from backend for this new root using the appropriate endpoint
          const resultUrls = await searchUrlsFrom(trimmed, searchMode, null);
          
          // If backend returns empty or fails, still create the root but with no children
          if (!resultUrls || !Array.isArray(resultUrls) || resultUrls.length === 0) {
            console.log("Backend returned no results. Creating root node only.");
            const newRoot = {
              id: nextId++,
              url: trimmed,
              parentId: null,
            };
            setNodeList((prev) => [...prev, newRoot]);
            return;
          }
          
          // Check for duplicates against existing nodes (including root keywords)
          const existingUrls = new Set(nodeList.map(n => n.url.toLowerCase()));

          // Create root node
          const newRoot = {
            id: nextId++,
            url: trimmed, // New root node with the keyword as URL value
            parentId: null, // This is a root node, no parent
          };

          // Create child nodes for the new root, skipping duplicates
          const children = [];
          for (const url of resultUrls) {
            // Skip if URL already exists in nodeList (avoid duplicates)
            if (existingUrls.has(url.toLowerCase())) {
              console.log(`Skipping duplicate URL when creating new root: ${url}`);
              continue;
            }
            
            existingUrls.add(url.toLowerCase());
            children.push({
              id: nextId++,
              url,
              parentId: newRoot.id, // All children have parentId = newRoot.id
            });
          }

          // Append new root and its children to the existing list
          setNodeList((prev) => [...prev, newRoot, ...children]);
          
          if (children.length < resultUrls.length) {
            console.log(`Created new root with ${children.length} children (${resultUrls.length - children.length} duplicates skipped)`);
          }
        }
        } else {
          // Matches found → branch from existing nodes
          // For each matching parent node, create branches
          const existingUrls = new Set(nodeList.map(n => n.url.toLowerCase()));
          
          for (const parent of matches) {
            const resultData = await searchUrlsFrom(trimmed, searchMode, parent.url);
            
            // Handle username and email search responses (returns full object)
            let resultUrls = [];
            if (searchMode === "Username" && resultData && resultData.sites_found) {
              // Extract URLs from sites_found
              resultUrls = resultData.sites_found
                .map((site) => site.url_user || site.url_main)
                .filter(Boolean);
            } else if (searchMode === "Email" && resultData && resultData.platforms_found) {
              // Extract platforms from platforms_found
              resultUrls = resultData.platforms_found
                .filter(Boolean)
                .map((platform) => platform.trim());
            } else if (Array.isArray(resultData)) {
              // For Keyword search mode, resultData is already an array of URLs
              resultUrls = resultData;
            }
            
            for (const url of resultUrls) {
              if (!url || !url.trim()) continue;
              
              // Skip if URL already exists in nodeList (avoid duplicates)
              if (existingUrls.has(url.toLowerCase())) {
                console.log(`Skipping duplicate URL: ${url}`);
                continue;
              }
              
              // Add to existing URLs set to prevent duplicates within this batch
              existingUrls.add(url.toLowerCase());
              
              // Create new node linked to the parent
              newNodes.push({
                id: nextId++,
                url: url.trim(),
                parentId: parent.id, // New node is a child of the matching parent
              });
            }
          }

          // Only append if we have new nodes to add
          if (newNodes.length > 0) {
            console.log(`Adding ${newNodes.length} new nodes linked to existing tree`);
            setNodeList((prev) => [...prev, ...newNodes]);
          } else {
            console.log("All URLs from search already exist in the node tree");
          }
        }
      }
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      // Set loading state to false when search completes
      setIsLoading(false);
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
