import React from "react";
import { Search, Zap, Shield, Rocket, Loader2 } from "lucide-react";

// --- Internal Components ---

// 1. FeatureCard component definition
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl transition-transform duration-300 hover:scale-[1.02] hover:shadow-blue-500/20">
    <div className="flex items-center space-x-4">
      {/* Icon is dynamically passed as a component (Icon) */}
      <div className="rounded-full bg-blue-500/20 p-3 text-blue-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="mt-4 text-gray-400">{description}</p>
  </div>
);

// 2. SearchResultCard component definition
const SearchResultCard = ({ title, snippet, mode }) => (
  <div className="rounded-lg bg-gray-800/70 p-4 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
    <span className="text-xs font-medium uppercase text-blue-400 tracking-wider">
      {mode} Result
    </span>
    <h4 className="text-lg font-semibold text-white mt-1">{title}</h4>
    <p className="text-sm text-gray-400 mt-1">{snippet}</p>
  </div>
);

// --- Main Application Component ---

export default function App() {
  // State for search functionality
  const [searchMode, setSearchMode] = React.useState("Keyword");
  const [searchText, setSearchText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);

  // Mock data for the features
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

  /**
   * Placeholder function that simulates fetching data from the future endpoint.
   * Your actual fetch call will replace the Promise and mock logic here.
   */
  const handleSearch = async () => {
    const query = searchText.trim();
    if (query === "") {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setResults([]);

    // --- PLACEHOLDER FOR BACKEND ENDPOINT ---
    // The actual code you will use later might look like this:
    /*
    try {
      const response = await fetch(`/api/search?mode=${searchMode}&query=${query}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([{ id: 99, title: "Search Error", snippet: "Could not connect to API.", mode: "Error" }]);
    }
    */

    // MOCK IMPLEMENTATION: Simulate API latency (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockData = mockSearchResults(searchMode, query);
    setResults(mockData);
    // --- END PLACEHOLDER ---

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-900 p-8 text-white font-sans">
      {/* --- Hero Section (Title & Search) --- */}
      <div className="flex w-full max-w-4xl flex-col items-center justify-center pt-24 pb-16 text-center">
        {/* Title */}
        <h1 className="mb-4 text-5xl font-JetBrains font-extrabold tracking-tight text-white md:text-7xl">
          Know Your <span className="text-blue-500">Origin</span>
        </h1>

        {/* Search Bar Container */}
        <div className="flex w-full max-w-lg items-stretch rounded-full border border-gray-700 bg-gray-800 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50">
          {/* Dropdown */}
          <div className="flex items-center pl-3">
            <select
              aria-label="Search mode"
              value={searchMode}
              onChange={(e) => {
                setSearchMode(e.target.value);
                setResults([]); // Clear results on mode change
              }}
              className="appearance-none rounded-full border-none bg-transparent py-3.5 pl-3 pr-8 text-lg text-gray-300 hover:text-white focus:outline-none focus:ring-0"
              style={{
                // Custom SVG arrow for the dropdown
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em",
              }}
            >
              <option value="Keyword" className="text-black">
                keyword
              </option>
              <option value="Username" className="text-black">
                username
              </option>
              <option value="Email" className="text-black">
                email
              </option>
              <option value="Phone" className="text-black">
                phone number
              </option>
            </select>
          </div>

          {/* Separator */}
          <div className="my-2 border-l border-gray-700"></div>

          {/* Search Input */}
          <div className="relative flex-grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`enter ${searchMode.toLowerCase()}...`}
              className="w-full rounded-r-full border-none bg-transparent py-3.5 pl-12 pr-5 text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Search Button (Optional, clicking on Enter key is primary) */}
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className={`p-3 rounded-full absolute right-2 inset-y-1 transition-all duration-200 ${
              isLoading
                ? "bg-blue-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
            aria-label="Execute search"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Search className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* --- Search Results Display --- */}
        <div className="mt-8 w-full max-w-lg min-h-20">
          {isLoading && (
            <div className="flex justify-center items-center py-4 space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-gray-400">Searching...</span>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="flex flex-col space-y-3">
              <p className="text-sm text-gray-400 text-left mb-2">
                Found {results.length} results for "{searchText}" in{" "}
                {searchMode}:
              </p>
              {results.map((result) => (
                <SearchResultCard
                  key={result.id}
                  title={result.title}
                  snippet={result.snippet}
                  mode={searchMode}
                />
              ))}
            </div>
          )}

          {!isLoading && results.length === 0 && searchText.trim() !== "" && (
            <p className="text-center text-gray-500 py-4">
              No results found for "{searchText}". Try a different mode.
            </p>
          )}
        </div>
      </div>

      {/* --- Features Section (Custom Cards) --- */}
      <div className="mt-16 w-full max-w-6xl">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Platform Core Features
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
