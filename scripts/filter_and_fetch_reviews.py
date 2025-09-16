import pandas as pd
import json
import requests
import time
from typing import List, Dict, Any

def filter_businesses_by_carrier(input_file: str, output_file: str) -> pd.DataFrame:
    """
    Filter businesses to keep only those with mobile, VOIP, or blank carrier types.
    Remove landline and fixed line carrier types.
    """
    print(f"Loading data from {input_file}...")
    df = pd.read_csv(input_file)

    initial_count = len(df)
    print(f"Initial businesses: {initial_count}")

    # Filter by carrier type
    # Keep: mobile, voip, or blank/NaN
    # Remove: landline, fixed line
    filtered_df = df[
        (df['phone.phones_enricher.carrier_type'] == 'mobile') |
        (df['phone.phones_enricher.carrier_type'] == 'voip') |
        (df['phone.phones_enricher.carrier_type'].isna()) |
        (df['phone.phones_enricher.carrier_type'] == '')
    ].copy()

    final_count = len(filtered_df)
    removed_count = initial_count - final_count

    print(f"Filtered businesses: {final_count}")
    print(f"Removed {removed_count} businesses with landline/fixed line")

    # Save filtered data
    filtered_df.to_csv(output_file, index=False)
    print(f"Saved filtered data to {output_file}")

    return filtered_df

def get_businesses_for_review_fetch(df: pd.DataFrame, min_reviews: int = 5) -> List[Dict[str, Any]]:
    """
    Get businesses with more than min_reviews reviews that have valid place_ids.
    """
    # Convert reviews column to numeric, handling empty strings and NaN
    df['reviews_numeric'] = pd.to_numeric(df['reviews'], errors='coerce').fillna(0)

    # Filter businesses with > min_reviews and valid place_id
    eligible = df[
        (df['reviews_numeric'] > min_reviews) &
        (df['place_id'].notna()) &
        (df['place_id'] != '')
    ]

    businesses = []
    for _, row in eligible.iterrows():
        businesses.append({
            'place_id': row['place_id'],
            'name': row['name'],
            'reviews_count': int(row['reviews_numeric']),
            'rating': row['rating'],
            'slug': row['slug'] if 'slug' in row else ''
        })

    print(f"Found {len(businesses)} businesses with >{min_reviews} reviews")
    return businesses

def fetch_reviews_from_api(place_ids: List[str], max_reviews_per_place: int = 10) -> Dict[str, List[Dict]]:
    """
    Fetch reviews for multiple place IDs using the Compass Google Maps Reviews API.
    """
    api_url = "https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items"
    api_token = "apify_api_DrC4qdJIT1ethXdgpU2tEqZeaobP0h4EfLZ3"

    reviews_data = {}

    # Process in batches of 5 place IDs
    batch_size = 5
    for i in range(0, len(place_ids), batch_size):
        batch = place_ids[i:i+batch_size]
        print(f"Fetching reviews for batch {i//batch_size + 1}/{(len(place_ids)-1)//batch_size + 1}...")

        payload = {
            "placeIds": batch,
            "maxReviews": max_reviews_per_place
        }

        try:
            response = requests.post(
                f"{api_url}?token={api_token}",
                json=payload,
                timeout=60  # Increased timeout
            )

            if response.status_code in [200, 201]:  # Accept both 200 and 201
                try:
                    reviews = response.json()
                    if isinstance(reviews, list):
                        # Group reviews by place_id
                        for review in reviews:
                            place_id = review.get('placeId')
                            if place_id:
                                if place_id not in reviews_data:
                                    reviews_data[place_id] = []
                                reviews_data[place_id].append(review)
                        print(f"  Successfully fetched {len(reviews)} reviews for batch")
                    else:
                        print(f"  Unexpected response format: {type(reviews)}")
                except json.JSONDecodeError:
                    print(f"  Could not parse JSON response")
            else:
                print(f"  Error fetching reviews: {response.status_code}")
                print(f"  Response: {response.text[:200]}")

        except requests.Timeout:
            print(f"  Timeout while fetching reviews")
        except Exception as e:
            print(f"  Exception during API call: {str(e)}")

        # Add delay between batches to avoid rate limiting
        if i + batch_size < len(place_ids):
            time.sleep(3)  # Increased delay

    return reviews_data

def save_reviews_to_file(reviews_data: Dict[str, List[Dict]], output_file: str):
    """
    Save fetched reviews to a JSON file.
    """
    with open(output_file, 'w') as f:
        json.dump(reviews_data, f, indent=2)
    print(f"Saved reviews to {output_file}")

def main():
    # File paths
    input_csv = "filtered_plumbing_data.csv"
    filtered_csv = "mobile_filtered_plumbing_data.csv"
    reviews_json = "fetched_reviews.json"

    # Step 1: Filter businesses by carrier type
    print("\n=== Step 1: Filtering by carrier type ===")
    filtered_df = filter_businesses_by_carrier(input_csv, filtered_csv)

    # Step 2: Get businesses eligible for review fetching
    print("\n=== Step 2: Identifying businesses for review fetch ===")
    eligible_businesses = get_businesses_for_review_fetch(filtered_df, min_reviews=5)

    if eligible_businesses:
        # Step 3: Fetch reviews from API
        print("\n=== Step 3: Fetching reviews from API ===")
        place_ids = [b['place_id'] for b in eligible_businesses]

        # Limit to first 20 businesses for initial test
        if len(place_ids) > 20:
            print(f"Limiting to first 20 businesses for testing (total: {len(place_ids)})")
            place_ids = place_ids[:20]

        reviews_data = fetch_reviews_from_api(place_ids, max_reviews_per_place=5)

        # Step 4: Save reviews
        print("\n=== Step 4: Saving reviews ===")
        save_reviews_to_file(reviews_data, reviews_json)

        # Print summary
        print("\n=== Summary ===")
        print(f"Total businesses processed: {len(filtered_df)}")
        print(f"Businesses with >5 reviews: {len(eligible_businesses)}")
        print(f"Reviews fetched for: {len(reviews_data)} businesses")
        print(f"Total reviews collected: {sum(len(reviews) for reviews in reviews_data.values())}")
    else:
        print("No businesses found with more than 5 reviews")

if __name__ == "__main__":
    main()