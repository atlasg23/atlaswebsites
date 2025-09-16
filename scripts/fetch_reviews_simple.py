import pandas as pd
import json
import requests
import time

# Load filtered data
df = pd.read_csv('mobile_filtered_plumbing_data.csv')
df['reviews_numeric'] = pd.to_numeric(df['reviews'], errors='coerce').fillna(0)

# Get businesses with >5 reviews
eligible = df[(df['reviews_numeric'] > 5) & (df['place_id'].notna())].copy()
print(f"Found {len(eligible)} businesses with >5 reviews")

# Take first 10 for testing
test_businesses = eligible.head(10)
place_ids = test_businesses['place_id'].tolist()

print(f"\nFetching reviews for {len(place_ids)} businesses...")

# API settings
api_url = "https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items"
api_token = "apify_api_DrC4qdJIT1ethXdgpU2tEqZeaobP0h4EfLZ3"

all_reviews = []
reviews_by_place = {}

# Process in small batches
batch_size = 2
for i in range(0, len(place_ids), batch_size):
    batch = place_ids[i:i+batch_size]
    print(f"\nBatch {i//batch_size + 1}: Fetching {len(batch)} places...")

    payload = {
        "placeIds": batch,
        "maxReviews": 5
    }

    try:
        response = requests.post(
            f"{api_url}?token={api_token}",
            json=payload,
            timeout=60
        )

        if response.status_code in [200, 201]:
            data = response.json()
            if isinstance(data, list):
                all_reviews.extend(data)

                # Group by place_id
                for review in data:
                    place_id = review.get('placeId')
                    if place_id:
                        if place_id not in reviews_by_place:
                            reviews_by_place[place_id] = {
                                'business_name': review.get('title', ''),
                                'rating': review.get('totalScore', 0),
                                'total_reviews': review.get('reviewsCount', 0),
                                'reviews': []
                            }
                        reviews_by_place[place_id]['reviews'].append({
                            'reviewer_name': review.get('name', ''),
                            'reviewer_photo': review.get('reviewerPhotoUrl', ''),
                            'stars': review.get('stars', 0),
                            'text': review.get('text', ''),
                            'date': review.get('publishAt', ''),
                            'likes': review.get('likesCount', 0)
                        })

                print(f"  Success: Got {len(data)} reviews")
            else:
                print(f"  Unexpected response type: {type(data)}")
        else:
            print(f"  Error: Status {response.status_code}")

    except Exception as e:
        print(f"  Exception: {str(e)}")

    # Delay between batches
    if i + batch_size < len(place_ids):
        time.sleep(2)

# Save reviews
print(f"\n=== Summary ===")
print(f"Total reviews fetched: {len(all_reviews)}")
print(f"Businesses with reviews: {len(reviews_by_place)}")

# Save organized reviews
with open('reviews_by_business.json', 'w') as f:
    json.dump(reviews_by_place, f, indent=2)
print("Saved to reviews_by_business.json")

# Also save raw reviews
with open('all_reviews_raw.json', 'w') as f:
    json.dump(all_reviews, f, indent=2)
print("Saved raw reviews to all_reviews_raw.json")

# Show sample
if reviews_by_place:
    sample_place = list(reviews_by_place.keys())[0]
    sample = reviews_by_place[sample_place]
    print(f"\nSample - {sample['business_name']}:")
    print(f"  Rating: {sample['rating']} ({sample['total_reviews']} reviews)")
    if sample['reviews']:
        print(f"  First review: {sample['reviews'][0]['stars']}★ - {sample['reviews'][0]['text'][:100]}...")