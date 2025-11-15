import SearchBar from "../components/SearchBar.jsx";
import FeatureCard from "../components/FeatureCard.jsx";

const LandingPageContent = ({
  features,
  searchProps,
  results,
  isLoading,
  searchMode,
  searchText,
}) => (
  <>
    {/* Title and Search */}
    <div className="flex w-full max-w-4xl flex-col items-center justify-center pt-24 pb-16 text-center">
      {/* Title */}
      <h1 className="mb-8 text-5xl font-JetBrains font-extrabold tracking-tight text-white md:text-7xl">
        Know Your <span className="text-blue-500">Origin</span>
      </h1>

      <SearchBar {...searchProps} />

      {/* Search Results Display (for landing page only) */}
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
              Found {results.length} results for "{searchText}" in {searchMode}.
              Switching to session view...
            </p>
          </div>
        )}

        {!isLoading && results.length === 0 && searchText.trim() !== "" && (
          <p className="text-center text-gray-500 py-4">
            No results found for "{searchText}". Try a different mode.
          </p>
        )}
      </div>
    </div>

    {/* Features Section (Custom Cards) */}
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
  </>
);

export default LandingPageContent;
