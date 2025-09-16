export interface PlumbingBusiness {
  name: string;
  phone: string;
  city: string;
  site: string;
  reviews_link: string;
  rating: number;
  reviews: number;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function parseCSV(csvText: string): PlumbingBusiness[] {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);

  const nameIndex = headers.indexOf('name');
  const phoneIndex = headers.indexOf('phone');
  const cityIndex = headers.indexOf('city');
  const siteIndex = headers.indexOf('site');
  const reviewsLinkIndex = headers.indexOf('reviews_link');
  const ratingIndex = headers.indexOf('rating');
  const reviewsIndex = headers.indexOf('reviews');

  const data: PlumbingBusiness[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length >= headers.length) {
      data.push({
        name: values[nameIndex] || '',
        phone: values[phoneIndex] || '',
        city: values[cityIndex] || '',
        site: values[siteIndex] || '',
        reviews_link: values[reviewsLinkIndex] || '',
        rating: parseFloat(values[ratingIndex]) || 0,
        reviews: parseFloat(values[reviewsIndex]) || 0,
      });
    }
  }

  return data;
}