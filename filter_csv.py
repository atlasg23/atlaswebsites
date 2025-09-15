
import pandas as pd
import re
import requests
import numpy as np
from PIL import Image
from io import BytesIO
from sklearn.cluster import KMeans
import colorsys

def create_slug(name):
    """Convert business name to lowercase slug format"""
    if pd.isna(name) or name == '':
        return ''
    
    # Convert to lowercase and remove special characters
    slug = re.sub(r'[^a-z0-9\s]', '', str(name).lower())
    # Replace spaces with nothing
    slug = re.sub(r'\s+', '', slug)
    return slug

def process_logo_url(logo_url):
    """Remove s44 part from Google logo URLs"""
    if pd.isna(logo_url) or logo_url == '':
        return ''
    
    # Remove the size parameter (s44, s64, etc.) from Google photos URLs
    processed_url = re.sub(r'/s\d+(-[a-z\-]*)?/', '/s256/', str(logo_url))
    return processed_url

def get_dominant_colors(image_url, num_colors=2):
    """Extract dominant colors from an image URL"""
    if pd.isna(image_url) or image_url == '':
        return '', ''
    
    try:
        # Download the image
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Open image and convert to RGB
        image = Image.open(BytesIO(response.content))
        image = image.convert('RGB')
        
        # Resize image to speed up processing
        image = image.resize((100, 100))
        
        # Convert image to numpy array
        data = np.array(image)
        data = data.reshape((-1, 3))
        
        # Use KMeans to find dominant colors
        kmeans = KMeans(n_clusters=min(num_colors, len(data)), random_state=42, n_init=10)
        kmeans.fit(data)
        
        # Get the colors
        colors = kmeans.cluster_centers_
        
        # Convert to hex colors
        hex_colors = []
        for color in colors:
            hex_color = '#{:02x}{:02x}{:02x}'.format(int(color[0]), int(color[1]), int(color[2]))
            hex_colors.append(hex_color)
        
        # Return primary and secondary colors
        primary_color = hex_colors[0] if len(hex_colors) > 0 else ''
        secondary_color = hex_colors[1] if len(hex_colors) > 1 else ''
        
        return primary_color, secondary_color
        
    except Exception as e:
        print(f"Error processing image {image_url}: {e}")
        return '', ''

def reverse_geocode(lat, lng, api_key):
    """Use Google Maps API to get city and state from coordinates"""
    if pd.isna(lat) or pd.isna(lng) or lat == '' or lng == '':
        return '', ''
    
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] == 'OK' and len(data['results']) > 0:
            components = data['results'][0]['address_components']
            
            city = ''
            state = ''
            
            for component in components:
                types = component['types']
                if 'locality' in types:
                    city = component['long_name']
                elif 'administrative_area_level_1' in types:
                    state = component['short_name']
            
            return city, state
        
    except Exception as e:
        print(f"Error geocoding {lat}, {lng}: {e}")
    
    return '', ''

# Configuration
GOOGLE_MAPS_API_KEY = "AIzaSyDJe6jp7mNRZm-dAGFAMrSSADU5KwD0vtc"

# Read the CSV file
df = pd.read_csv('plumbing-la (1)_1757975155716.csv')

# For testing, limit to first 10 rows
df = df.head(10)
print(f"Testing with first 10 rows only")

# Define the columns to keep
columns_to_keep = [
    'name',
    'site', 
    'subtypes',
    'category',
    'type',
    'phone',
    'phone.phones_enricher.carrier_name',
    'phone.phones_enricher.carrier_type',
    'latitude',
    'longitude',
    'full_address',
    'city',
    'state',
    'area_service',
    'rating',
    'reviews',
    'reviews_link',
    'photos_count',
    'working_hours',
    'verified',
    'location_link',
    'place_id',
    'email_1',
    'email_1.emails_validator.status',
    'facebook',
    'instagram',
    'logo'
]

# Filter the dataframe to only include existing columns
existing_columns = [col for col in columns_to_keep if col in df.columns]
filtered_df = df[existing_columns].copy()

# Add missing columns with empty values
for col in columns_to_keep:
    if col not in filtered_df.columns:
        filtered_df[col] = ''

# Process logos and get colors
print("Processing logos and extracting colors...")
primary_colors = []
secondary_colors = []
processed_logos = []

for idx, logo_url in enumerate(filtered_df['logo']):
    if idx % 10 == 0:
        print(f"Processing logo {idx + 1}/{len(filtered_df)}")
    
    # Process logo URL
    processed_logo = process_logo_url(logo_url)
    processed_logos.append(processed_logo)
    
    # Get dominant colors
    primary, secondary = get_dominant_colors(processed_logo)
    primary_colors.append(primary)
    secondary_colors.append(secondary)

# Update logo column and add color columns
filtered_df['logo'] = processed_logos
filtered_df['primary_color'] = primary_colors
filtered_df['secondary_color'] = secondary_colors

# Create slug column from business name
filtered_df['slug'] = filtered_df['name'].apply(create_slug)

# Fill missing city and state using reverse geocoding
print("Filling missing city and state data using Google Maps API...")
for idx, row in filtered_df.iterrows():
    if (pd.isna(row['city']) or row['city'] == '') or (pd.isna(row['state']) or row['state'] == ''):
        if idx % 10 == 0:
            print(f"Geocoding row {idx + 1}/{len(filtered_df)}")
        
        city, state = reverse_geocode(row['latitude'], row['longitude'], GOOGLE_MAPS_API_KEY)
        
        if pd.isna(row['city']) or row['city'] == '':
            filtered_df.at[idx, 'city'] = city
        if pd.isna(row['state']) or row['state'] == '':
            filtered_df.at[idx, 'state'] = state

# Save the filtered CSV
filtered_df.to_csv('filtered_plumbing_data.csv', index=False)

print(f"Original CSV had {len(df)} rows and {len(df.columns)} columns")
print(f"Filtered CSV has {len(filtered_df)} rows and {len(filtered_df.columns)} columns")
print(f"Saved as 'filtered_plumbing_data.csv'")

# Display the column names in the filtered file
print("\nColumns in filtered file:")
for i, col in enumerate(filtered_df.columns, 1):
    print(f"{i}. {col}")

print("\nSample of processed data:")
print(filtered_df[['name', 'city', 'state', 'primary_color', 'secondary_color', 'slug']].head())
