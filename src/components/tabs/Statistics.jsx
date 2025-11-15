import React, { useState } from "react";
import StatisticsAPI from "../../api/StatisticsAPI";
import analyzeContentWithGemini from "../../api/GeminiAPI";

const StatisticsContent = () => {
  const data = StatisticsAPI();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const getThreatColor = (score) => {
    if (score >= 1 && score <= 25) return "#26de81"; // Green - Safe
    if (score >= 26 && score <= 50) return "#ffd700"; // Yellow - Low Risk
    if (score >= 51 && score <= 75) return "#ffa502"; // Orange - Medium Risk
    if (score >= 76 && score <= 100) return "#ff4757"; // Red - High Risk
    return "#ccc"; // Default
  };

  const getThreatLabel = (score) => {
    if (score >= 1 && score <= 25) return "Safe";
    if (score >= 26 && score <= 50) return "Low Risk";
    if (score >= 51 && score <= 75) return "Medium Risk";
    if (score >= 76 && score <= 100) return "High Risk";
    return "Unknown";
  };

  const handleAnalyze = async (item) => {
    setIsAnalyzing(true);
    setAnalyzingId(item.record_id);
    
    try {
      // Call Gemini API for analysis
      const result = await analyzeContentWithGemini(item);
      
      setAnalysisResult(result);
      setShowModal(true);
    } catch (error) {
      console.error("Error analyzing content:", error);
      // Show error in modal
      setAnalysisResult({
        threat_score: 50,
        verdict: "error",
        reason: `Failed to analyze content: ${error.message}`,
        error: true
      });
      setShowModal(true);
    } finally {
      setIsAnalyzing(false);
      setAnalyzingId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setAnalysisResult(null);
  };

  return (
    <div className="p-8" style={{ maxHeight: "60vh", overflowY: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#1e1e1e",
          color: "white",
          borderRadius: 8,
          overflow: "hidden"
        }}
      >
        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
          <tr style={{ backgroundColor: "#2a2a2a" }}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Source</th>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Author</th>
            <th style={thStyle}>Link</th>
            <th style={thStyle}>Analyzer</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ ...tdStyle, textAlign: "center", padding: "40px" }}>
                Loading data...
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.record_id} style={rowStyle}>
                <td style={tdStyle}>{item.record_id}</td>
                <td style={tdStyle}>{item.source}</td>
                <td style={{ ...tdStyle, maxWidth: "300px" }}>
                  {item.title}
                </td>
                <td style={tdStyle}>
                  <a 
                    href={item.link_to_author} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ color: "#80b3ff", textDecoration: "none" }}
                  >
                    {item.author}
                  </a>
                </td>
                <td style={tdStyle}>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ color: "#4a90e2", textDecoration: "none" }}
                  >
                    View Post
                  </a>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleAnalyze(item)}
                    disabled={isAnalyzing && analyzingId === item.record_id}
                    style={{
                      padding: "6px 16px",
                      backgroundColor: isAnalyzing && analyzingId === item.record_id ? "#357abd" : "#4a90e2",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isAnalyzing && analyzingId === item.record_id ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onMouseEnter={(e) => {
                      if (!(isAnalyzing && analyzingId === item.record_id)) {
                        e.target.style.backgroundColor = "#357abd";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(isAnalyzing && analyzingId === item.record_id)) {
                        e.target.style.backgroundColor = "#4a90e2";
                      }
                    }}
                  >
                    {isAnalyzing && analyzingId === item.record_id ? (
                      <>
                        <span style={{
                          display: "inline-block",
                          width: "14px",
                          height: "14px",
                          border: "2px solid white",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }}></span>
                        Analyzing...
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Analysis Modal */}
      {showModal && analysisResult && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#2a2a2a",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "600px",
              width: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "#999",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px 8px"
              }}
            >
              ×
            </button>

            <h2 style={{ marginTop: 0, marginBottom: "24px", color: "white", fontSize: "24px" }}>
              Analysis Results
            </h2>

            {/* Verdict Badge */}
            <div style={{ marginBottom: "24px", textAlign: "center" }}>
              <span style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: "20px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: analysisResult.verdict === "good" ? "#26de81" : analysisResult.verdict === "bad" ? "#ff4757" : "#ffa502",
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {analysisResult.verdict === "good" ? "✓ SAFE CONTENT" : analysisResult.verdict === "bad" ? "⚠ THREAT DETECTED" : "? UNKNOWN"}
              </span>
            </div>

            {/* Threat Score */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ color: "#ccc", fontSize: "16px", marginBottom: "12px" }}>
                Threat Score
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: getThreatColor(analysisResult.threat_score),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "white",
                    boxShadow: `0 0 20px ${getThreatColor(analysisResult.threat_score)}40`
                  }}
                >
                  {analysisResult.threat_score}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    width: "100%",
                    height: "12px",
                    backgroundColor: "#1a1a1a",
                    borderRadius: "6px",
                    overflow: "hidden"
                  }}>
                    <div
                      style={{
                        width: `${analysisResult.threat_score}%`,
                        height: "100%",
                        backgroundColor: getThreatColor(analysisResult.threat_score),
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                  <div style={{ marginTop: "8px", color: "#999", fontSize: "14px" }}>
                    {getThreatLabel(analysisResult.threat_score)}
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <h3 style={{ color: "#ccc", fontSize: "16px", marginBottom: "12px" }}>
                Analysis Reason
              </h3>
              <p style={{
                color: "#ddd",
                lineHeight: "1.6",
                fontSize: "14px",
                backgroundColor: "#1a1a1a",
                padding: "16px",
                borderRadius: "8px",
                margin: 0
              }}>
                {analysisResult.reason}
              </p>
            </div>

            {/* Close Button at Bottom */}
            <button
              onClick={closeModal}
              style={{
                marginTop: "24px",
                padding: "10px 24px",
                backgroundColor: "#4a90e2",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                width: "100%"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#357abd"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#4a90e2"}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #444",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #333",
};

const rowStyle = {
  backgroundColor: "#1f1f1f",
};

export default StatisticsContent;
