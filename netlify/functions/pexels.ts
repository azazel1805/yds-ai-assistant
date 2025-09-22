import type { Handler, HandlerEvent } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent) => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'PEXELS_API_KEY is not set.' }) };
  }

  const query = event.queryStringParameters?.query;
  if (!query) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Query parameter is missing.' }) };
  }

  try {
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
    const pexelsResponse = await fetch(pexelsUrl, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!pexelsResponse.ok) {
      const errorText = await pexelsResponse.text();
      return { statusCode: pexelsResponse.status, body: JSON.stringify({ error: `Pexels API error: ${errorText}` }) };
    }

    const data = await pexelsResponse.json();
    const imageUrl = data.photos && data.photos.length > 0 ? data.photos[0].src.large : null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    };
  } catch (error: any) {
    console.error("Error in Pexels function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "An internal server error occurred." }),
    };
  }
};

export { handler };