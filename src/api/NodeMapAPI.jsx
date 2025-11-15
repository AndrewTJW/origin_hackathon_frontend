import { useEffect, useState } from "react";
import NodeMap from "../components/tabs/ForceGraph";

//for testing dummy data
import dummydata from "../../nodedata.json"
import ForceGraph from "../components/tabs/ForceGraph";

export default function NodeAPI() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        //const res = await fetch("http://localhost:5173/maigret/search?username={$searchText}");
        //const data = await res.json();

        setNodes(dummydata.nodes);
        setLinks(dummydata.links);
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
