import { useEffect, useState } from "react";

// comment line below to use tiktok api
//import statsData from "../../stats.json";

export default function StatisticsAPI() {
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                //uncomment to use tiktok api
                const res = await fetch("http://127.0.0.1:8000/tiktok/search?q=${searchText}");
                const apiData = await res.json();
                setData(apiData);

                // Group records by source to ensure diversity
                const sourceGroups = {};
                apiData.forEach(item => {
                    if (!sourceGroups[item.source]) {
                        sourceGroups[item.source] = [];
                    }
                    sourceGroups[item.source].push(item);
                });

                // Select 2 from each source type (TikTok, Instagram, Facebook, YouTube, Reddit)
                const diverseData = [];
                const sourcesToInclude = ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'Reddit'];
                
                sourcesToInclude.forEach(source => {
                    if (sourceGroups[source]) {
                        diverseData.push(...sourceGroups[source].slice(0, 2));
                    }
                });
                
                setData(diverseData.slice(0, 10));

            } catch (err) {
                console.error("Error fetching data:", err);
            }
        }

        fetchData();
    }, []);

    return data;
}