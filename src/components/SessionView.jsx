import React from "react";
import SearchBar from "./SearchBar";
import { Download, RefreshCw } from "lucide-react";

const SessionViewContent = ({
  searchProps,
  activeTab,
  setActiveTab,
  startNewSession,
  renderTabContent,
}) => {
  const tabNames = ["Heat Map", "Node Map", "Statistics"];

  return (
    <div className="w-full max-w-7xl flex flex-col items-center pt-8">
      <div className="pb-8 w-full flex justify-center">
        <SearchBar {...searchProps} />
      </div>

      <div className="w-full border-b border-gray-700 mb-6">
        <nav className="flex space-x-4">
          {tabNames.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-medium text-lg transition-colors duration-200  ${
                activeTab === tab
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="w-full rounded-xl bg-gray-800 border border-gray-700 shadow-lg mb-10 overflow-hidden">
        {renderTabContent()}
      </div>

      <div className="flex space-x-6 justify-center w-full pb-8">
        {activeTab === "Node Map" && (
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2 font-medium"
          >
            <Download className="h-5 w-5" />
            <span>Download Node Map</span>
          </a>
        )}

        <button
          onClick={startNewSession}
          className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 font-medium"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Start New Session</span>
        </button>
      </div>
    </div>
  );
};

export default SessionViewContent;
