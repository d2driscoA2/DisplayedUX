// Netlify Function to validate phone numbers with TeleSign API
// This keeps your API credentials secure on the server

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get phone number from request
  const { phoneNumber } = JSON.parse(event.body);

  if (!phoneNumber || phoneNumber.length !== 10) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid phone number' })
    };
  }

  // TeleSign credentials from environment variables
  const TELESIGN_CUSTOMER_ID = process.env.TELESIGN_CUSTOMER_ID;
  const TELESIGN_API_KEY = process.env.TELESIGN_API_KEY;

  if (!TELESIGN_CUSTOMER_ID || !TELESIGN_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'TeleSign credentials not configured' })
    };
  }

  try {
    // Call TeleSign API
    const auth = Buffer.from(`${TELESIGN_CUSTOMER_ID}:${TELESIGN_API_KEY}`).toString('base64');
    
    const response = await fetch(
      `https://rest-api.telesign.com/v1/phoneid/score/${phoneNumber}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'account_lifecycle_event=create'
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TeleSign API error:', response.status, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'TeleSign API error',
          details: errorText 
        })
      };
    }

    const data = await response.json();

    // Return successful response
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Error calling TeleSign:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to validate phone number',
        details: error.message 
      })
    };
  }
};
