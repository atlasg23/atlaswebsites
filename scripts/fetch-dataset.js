const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchDataset() {
  try {
    console.log('Fetching dataset from Apify...');

    const response = await axios.get(
      'https://api.apify.com/v2/datasets/agdWkQLnTtYmn6GIY/items?token=apify_api_DrC4qdJIT1ethXdgpU2tEqZeaobP0h4EfLZ3',
      {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(`Response status: ${response.status}`);
    console.log(`Data type: ${typeof response.data}`);
    console.log(`Is array: ${Array.isArray(response.data)}`);

    if (Array.isArray(response.data)) {
      console.log(`Number of items: ${response.data.length}`);

      // Save to file
      const outputFile = path.join(__dirname, '..', 'data', 'apify-dataset.json');
      fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
      console.log(`\nData saved to: ${outputFile}`);

      // Show first item structure
      if (response.data.length > 0) {
        console.log('\nFirst item structure:');
        console.log(JSON.stringify(response.data[0], null, 2).substring(0, 1000));

        // Check if it has reviews
        if (response.data[0].reviews) {
          console.log(`\nFirst item has ${response.data[0].reviews.length} reviews`);

          // Count 5-star reviews
          const fiveStarCount = response.data[0].reviews.filter(r => r.stars === 5).length;
          console.log(`Five-star reviews: ${fiveStarCount}`);
        }
      }
    } else {
      console.log('Response data:', JSON.stringify(response.data, null, 2).substring(0, 500));
    }

  } catch (error) {
    console.error('Error fetching dataset:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

fetchDataset();