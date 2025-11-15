// API integration for threat analysis

const API_URL = "http://127.0.0.1:8000/analyze-title";

export async function analyzeContentWithGemini(postData) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        record_id: postData.record_id,
        title: postData.title
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response Error:", errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const result = await response.json();

    // Ensure threat_score is within 0-100 range
    if (result.threat_score !== undefined) {
      result.threat_score = Math.max(0, Math.min(100, result.threat_score));
    }

    return result;

  } catch (error) {
    console.error("Error calling analysis API:", error);
    
    // Return a fallback response
    return {
      threat_score: 50,
      verdict: "error",
      reason: `Unable to analyze content at this time. Error: ${error.message}. Please check your API connection.`,
      error: true
    };
  }
}

export default analyzeContentWithGemini;
