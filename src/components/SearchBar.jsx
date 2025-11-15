import React from "react";
import { Search, Loader2 } from "lucide-react";

const SearchBar = ({
  searchMode,
  searchText,
  isLoading,
  handleSearch,
  handleKeyDown,
  setSearchMode,
  setSearchText,
  uiMode,
}) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div
      className={`flex w-full max-w-lg items-stretch rounded-full border border-gray-700 bg-gray-800 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50 relative ${
        uiMode === "session" ? "max-w-4xl" : "max-w-lg"
      }`}
    >
    <div className="flex items-center pl-3">
      <select
        aria-label="Search mode"
        value={searchMode}
        onChange={(e) => {
          setSearchMode(e.target.value);
          setSearchText("");
        }}
        className="appearance-none rounded-full border-none bg-transparent py-3.5 pl-3 pr-8 text-lg text-gray-300 hover:text-white focus:outline-none focus:ring-0"
        style={{
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
      </select>
    </div>

    <div className="my-2 border-l border-gray-700"></div>

    <div className="relative flex-grow">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-gray-500" />
      </div>
      <input
        type="search"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)} // just store text, no search
        onKeyDown={handleKeyDown} // search triggers only on Enter
        placeholder={`enter ${searchMode.toLowerCase()}...`}
        onKeyPress={handleKeyPress}
        className="w-full rounded-r-full border-none bg-transparent py-3.5 pl-12 pr-24 text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-0"
      />
    </div>

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
  );
};

export default SearchBar;
