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
      {/* Top Search Bar (Persistent) */}
      <div className="pb-8 w-full flex justify-center">
        <SearchBar {...searchProps} />
      </div>

      {/* Tab Navigation */}
      <div className="w-full border-b border-gray-700 mb-6">
        <nav className="flex space-x-4">
          {tabNames.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-medium text-lg transition-colors duration-200 ${
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

      {/* Tab Content */}
      <div className="w-full rounded-xl bg-gray-800 border border-gray-700 shadow-lg mb-10">
        {renderTabContent()}
      </div>

      {/* Bottom Actions */}
      <div className="flex space-x-6 justify-center w-full pb-8">
        {/* Download Link (Statistics Only) */}
        {activeTab === "Statistics" && (
          <a
            href="#" // Placeholder for actual download link
            onClick={(e) => e.preventDefault()} // Prevent default navigation
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2 font-medium"
          >
            <Download className="h-5 w-5" />
            <span>Download Statistics File</span>
          </a>
        )}

        {/* New Session Link */}
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
