import { useEffect, useState } from "react";
import NodeMap from "../components/tabs/ForceGraph";

//for testing dummy data
import usernameOutput from "../../username.json"
import dummydata from "../../nodedata.json"
import ForceGraph from "../components/tabs/ForceGraph";

export default function NodeAPI() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // const res = await fetch("http://127.0.0.1:8000/maigret/search?username={$searchText}");
        // const data = await res.json();

        // Transform username.json into nodes and links format
        const transformedNodes = [];
        const transformedLinks = [];

        // Create central node for the username
        transformedNodes.push({
          id: usernameOutput.username,
          name: usernameOutput.username
        });
        
        // Create nodes for each site and links connecting them to the username
        usernameOutput.sites_found.forEach((site, index) => {
          // Create a node for each site
          transformedNodes.push({
            id: site.url_user,
            name: site.site
          });
          
          // Create a link from username to this site
          transformedLinks.push({
            source: usernameOutput.username,
            target: site.url_user
          });
        });

        setNodes(transformedNodes);
        setLinks(transformedLinks);
        
        // setNodes(dummydata.nodes);
        // setLinks(dummydata.links);
      } catch (err) {
        console.error("Error fetching graph data:", err);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1>Network Graph</h1>
      <ForceGraph nodes={nodes} links={links} />
    </div>
  );
}
