import React from "react";

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl transition-transform duration-300 hover:scale-[1.02] hover:shadow-blue-500/20">
    <div className="flex items-center space-x-4">
      <div className="rounded-full bg-blue-500/20 p-3 text-blue-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="mt-4 text-gray-400">{description}</p>
  </div>
);

export default FeatureCard;
