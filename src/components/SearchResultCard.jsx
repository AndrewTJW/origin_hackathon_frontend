const SearchResultCard = ({ title, snippet, mode }) => (
  <div className="rounded-lg bg-gray-800/70 p-4 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
    <span className="text-xs font-medium uppercase text-blue-400 tracking-wider">
      {mode} Result
    </span>
    <h4 className="text-lg font-semibold text-white mt-1">{title}</h4>
    <p className="text-sm text-gray-400 mt-1">{snippet}</p>
  </div>
);

export default SearchResultCard;
