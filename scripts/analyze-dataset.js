const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/apify-dataset.json'));

// Count error types
const errorCounts = {};
data.forEach(item => {
  if (item.error) {
    errorCounts[item.error] = (errorCounts[item.error] || 0) + 1;
  }
});

console.log('Dataset Analysis:');
console.log('Total items:', data.length);
console.log('\nError breakdown:');
Object.entries(errorCounts).forEach(([error, count]) => {
  console.log(`  ${error}: ${count}`);
});

// Check successful items
const successful = data.filter(item => !item.error && item.placeId);
console.log('\nSuccessful items (no error, has placeId):', successful.length);

// Check for items with reviews
const withReviews = data.filter(item => item.reviews && item.reviews.length > 0);
console.log('Items with reviews:', withReviews.length);

// Sample a few items
console.log('\nSample items:');
data.slice(0, 3).forEach((item, i) => {
  console.log(`\nItem ${i + 1}:`);
  console.log(`  Search: ${item.searchString?.substring(0, 100)}`);
  console.log(`  Place ID: ${item.placeId}`);
  console.log(`  Title: ${item.title}`);
  console.log(`  Error: ${item.error}`);
  console.log(`  Reviews: ${item.reviews?.length || 0}`);
});