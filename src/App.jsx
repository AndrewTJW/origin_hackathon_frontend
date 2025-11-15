import React from "react";
import LandingPageContent from "./components/LandingPage";
import SessionViewContent from "./components/SessionView";
import HeatMapContent from "./components/tabs/Heatmap";
import NodeMapContent from "./components/tabs/Nodemap";
import StatisticsContent from "./components/tabs/Statistics";
import { Zap, Shield, Rocket } from "lucide-react";

export default function App() {
  const [uiMode, setUiMode] = React.useState("landing");
  const [searchMode, setSearchMode] = React.useState("Keyword");
  const [searchText, setSearchText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState("Heat Map");
  // NEW: used to trigger NodeMap searches
  const [nodeSearchSignal, setNodeSearchSignal] = React.useState(0);
  // NEW: download function for Node Map
  const [nodeMapDownloadFn, setNodeMapDownloadFn] = React.useState(null);

  const features = [
    {
      icon: Zap,
      title: "Blazing Fast Performance",
      description:
        "Optimized for speed, our platform delivers a seamless and responsive user experience.",
    },
    {
      icon: Shield,
      title: "Ironclad Security",
      description:
        "Keep your data safe with our state-of-the-art security protocols and encryption.",
    },
    {
      icon: Rocket,
      title: "Effortless Deployment",
      description:
        "Get up and running in minutes with our intuitive setup and one-click deployment.",
    },
  ];

  const mockSearchResults = (mode, query) => {
    if (query.length < 3) return [];
    const baseTitle = `Record found for: ${query}`;
    if (mode === "Phone")
      return [
        { id: 1, title: baseTitle, snippet: "Linked to 3 social accounts." },
      ];
    if (mode === "Username")
      return [
        { id: 1, title: `Profile for ${query}`, snippet: "Active since 2018." },
      ];
    if (mode === "Email")
      return [
        {
          id: 1,
          title: `Email Check for ${query}`,
          snippet: "Confirmed presence in 2 data breach databases.",
        },
      ];
    return [
      {
        id: 1,
        title: `Keyword Match: "${query}"`,
        snippet: "Found best practices guide.",
      },
    ];
  };

  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setResults([]);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockData = mockSearchResults(searchMode, query);
    setResults(mockData);

    if (mockData.length > 0) setUiMode("session");
    setIsLoading(false);

    // 🔔 NEW: tell NodeMap "a search just happened"
    setNodeSearchSignal((prev) => prev + 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const startNewSession = () => {
    setUiMode("landing");
    setSearchText("");
    setResults([]);
    setActiveTab("Heat Map");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Node Map":
        return (
          <NodeMapContent
            searchKeyword={searchText}
            searchSignal={nodeSearchSignal}
            searchMode={searchMode}
            onDownloadReady={setNodeMapDownloadFn}
          />
        );
      case "Statistics":
        return <StatisticsContent />;
      case "Heat Map":
      default:
        return <HeatMapContent keyword={searchText} />;
    }
  };


  const searchBarProps = {
    searchMode,
    searchText,
    isLoading,
    handleSearch,
    handleKeyDown,
    setSearchMode,
    setSearchText,
    uiMode,
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-900 p-8 text-white font-sans">
      {uiMode === "landing" ? (
        <LandingPageContent
          features={features}
          searchProps={searchBarProps}
          results={results}
          isLoading={isLoading}
          searchMode={searchMode}
          searchText={searchText}
        />
      ) : (
        <SessionViewContent
          searchProps={searchBarProps}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          startNewSession={startNewSession}
          renderTabContent={renderTabContent}
          nodeMapDownloadFn={nodeMapDownloadFn}
        />
      )}
    </div>
  );
}
