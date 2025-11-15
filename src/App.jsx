import React from "react";
import { Search, Zap, Shield, Rocket, Loader2 } from "lucide-react";
import HeatMapContent from "./components/tabs/Heatmap.jsx";
import NodeMapContent from "./components/tabs/Nodemap.jsx";
import StatisticsContent from "./components/tabs/Statistics.jsx";
import LandingPageContent from "./pages/landing.jsx";
import SessionViewContent from "./components/SessionView.jsx";

export default function Landing() {
  // State for UI management: 'landing' or 'session'
  const [uiMode, setUiMode] = React.useState("landing");

  // Search and results state
  const [searchMode, setSearchMode] = React.useState("Keyword");
  const [searchText, setSearchText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);

  // Tab state for the session view
  const [activeTab, setActiveTab] = React.useState("Heat Map");

  // Mock data for the features (used in 'landing' mode)
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

  // Mock function to simulate the backend API response
  const mockSearchResults = (mode, query) => {
    if (query.length < 3) return [];

    const baseTitle = `Record found for: ${query}`;

    if (mode === "Phone") {
      return [
        {
          id: 1,
          title: `${baseTitle}`,
          snippet: "Linked to 3 social accounts, last activity 2 days ago.",
        },
        {
          id: 2,
          title: `Geo-location Data for ${query}`,
          snippet: "Accessed 5 different IPs in the last week.",
        },
      ];
    } else if (mode === "Username") {
      return [
        {
          id: 1,
          title: `Profile for ${query}`,
          snippet: "Active since 2018. Associated with gaming communities.",
        },
        {
          id: 2,
          title: `Forum Posts by ${query}`,
          snippet: "Found 12 posts across various public forums.",
        },
      ];
    } else if (mode === "Email") {
      return [
        {
          id: 1,
          title: `Email Check for ${query}`,
          snippet: "Confirmed presence in 2 data breach databases.",
        },
        {
          id: 2,
          title: `Domain Registration for ${query.split("@")[1]}`,
          snippet: "Domain registered in 2015 via GoDaddy.",
        },
      ];
    } else {
      // Keyword
      return [
        {
          id: 1,
          title: `Keyword Match: "${query}" in Documentation`,
          snippet: "Found best practices guide on deployment security.",
        },
        {
          id: 2,
          title: `Keyword Match: "${query}" in Feature Glossary`,
          snippet:
            "Definition found for the term in our latest feature release.",
        },
      ];
    }
  };

  const handleSearch = async () => {
    const query = searchText.trim();
    if (query === "") {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setResults([]);

    // MOCK IMPLEMENTATION: Simulate API latency (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockData = mockSearchResults(searchMode, query);
    setResults(mockData);

    // If we find results, switch to the detailed session view
    if (mockData.length > 0) {
      setUiMode("session");
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const startNewSession = () => {
    setUiMode("landing");
    setSearchText("");
    setResults([]);
    setActiveTab("Heat Map"); // Reset tab to default
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Node Map":
        return <NodeMapContent />;
      case "Statistics":
        return <StatisticsContent />;
      case "Heat Map":
      default:
        return <HeatMapContent />;
    }
  };

  // Props bundle for the reusable SearchBar
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

  // --- Main Render Block ---
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
        />
      )}
    </div>
  );
}
