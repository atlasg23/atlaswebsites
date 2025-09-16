import pandas as pd
import os

# Read the mobile filtered CSV
input_file = '/home/runner/workspace/data/mobile_filtered_plumbing_data.csv'
output_with_sites = '/home/runner/workspace/data/mobile_with_websites.csv'
output_without_sites = '/home/runner/workspace/data/mobile_without_websites.csv'

# Read the CSV
df = pd.read_csv(input_file)

# Check column names to find the website column
print("Column names:", df.columns.tolist())
print(f"Total rows: {len(df)}")

# Identify the website column (could be 'site' or 'website')
website_column = None
for col in ['site', 'website', 'Site', 'Website']:
    if col in df.columns:
        website_column = col
        break

if website_column:
    print(f"Found website column: {website_column}")

    # Split into businesses with and without websites
    # Consider empty strings and NaN as no website
    df_with_sites = df[df[website_column].notna() & (df[website_column].str.strip() != '')]
    df_without_sites = df[df[website_column].isna() | (df[website_column].str.strip() == '')]

    print(f"Businesses with websites: {len(df_with_sites)}")
    print(f"Businesses without websites: {len(df_without_sites)}")

    # Save to CSV files
    df_with_sites.to_csv(output_with_sites, index=False)
    df_without_sites.to_csv(output_without_sites, index=False)

    print(f"\nCreated files:")
    print(f"  - {output_with_sites}")
    print(f"  - {output_without_sites}")
else:
    print("No website column found in the CSV")