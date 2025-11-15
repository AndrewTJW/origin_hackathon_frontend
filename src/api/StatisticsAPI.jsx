import { useEffect, useState } from "react";

// comment line below to use tiktok api
import statsData from "../../stats.json";

export default function StatisticsAPI() {
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                //uncomment to use tiktok api
                //const res = await fetch("http://127.0.0.1:8000/tiktok/search?q={$searchText}");
                //const apiData = await res.json();
                //setData(apiData);

                // Using local stats.json for now - taking only top 10
                setData(statsData.slice(0, 10));

            } catch (err) {
                console.error("Error fetching data:", err);
            }
        }

        fetchData();
    }, []);

    return data;
}