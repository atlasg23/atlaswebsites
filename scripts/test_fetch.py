import requests
import json
import time

# Test with just 2 place IDs
place_ids = [
    "ChIJj_d7X3xF-mQRC8d5AQxaCsE",  # Prestige Plumbing Repair LLC (9 reviews)
    "ChIJ4eLlflDidKsRVg1SXkQ_anE"   # Nathan DeBusk Plumbing, LLC (9 reviews)
]

api_url = "https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items"
api_token = "apify_api_DrC4qdJIT1ethXdgpU2tEqZeaobP0h4EfLZ3"

print("Testing API with 2 place IDs...")
print(f"Place IDs: {place_ids}")

payload = {
    "placeIds": place_ids,
    "maxReviews": 3
}

print("\nSending request...")
response = requests.post(
    f"{api_url}?token={api_token}",
    json=payload,
    timeout=60
)

print(f"Status code: {response.status_code}")

if response.status_code in [200, 201]:
    try:
        data = response.json()
        print(f"Response type: {type(data)}")
        if isinstance(data, list):
            print(f"Got {len(data)} reviews total")

            # Group by place_id
            by_place = {}
            for review in data:
                pid = review.get('placeId')
                if pid not in by_place:
                    by_place[pid] = []
                by_place[pid].append(review)

            for pid, reviews in by_place.items():
                print(f"\nPlace ID {pid}: {len(reviews)} reviews")
                for r in reviews[:2]:  # Show first 2 reviews
                    print(f"  - {r.get('name')}: {r.get('stars')}★ - {r.get('text', 'No text')[:50]}...")

            # Save to file
            with open('test_reviews.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\nSaved to test_reviews.json")
        else:
            print(f"Unexpected response: {data}")
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Response text: {response.text[:500]}")
else:
    print(f"Error: {response.text[:500]}")