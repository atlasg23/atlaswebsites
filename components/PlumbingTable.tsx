import React, { useState, useMemo } from 'react';

interface PlumbingBusiness {
  name: string;
  phone: string;
  city: string;
  site: string;
  reviews_link: string;
  rating: number;
  reviews: number;
}

interface PlumbingTableProps {
  data: PlumbingBusiness[];
}

const PlumbingTable: React.FC<PlumbingTableProps> = ({ data }) => {
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [reviewsFilter, setReviewsFilter] = useState<string>('all');
  const [websiteFilter, setWebsiteFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    return data.filter(business => {
      let passesFilter = true;

      if (ratingFilter !== 'all') {
        const rating = business.rating || 0;
        if (ratingFilter === '5') passesFilter = passesFilter && rating === 5;
        if (ratingFilter === '4+') passesFilter = passesFilter && rating >= 4;
        if (ratingFilter === '3+') passesFilter = passesFilter && rating >= 3;
        if (ratingFilter === '<3') passesFilter = passesFilter && rating < 3;
      }

      if (reviewsFilter !== 'all') {
        const reviews = business.reviews || 0;
        if (reviewsFilter === '50+') passesFilter = passesFilter && reviews >= 50;
        if (reviewsFilter === '20+') passesFilter = passesFilter && reviews >= 20;
        if (reviewsFilter === '10+') passesFilter = passesFilter && reviews >= 10;
        if (reviewsFilter === '<10') passesFilter = passesFilter && reviews < 10;
      }

      if (websiteFilter !== 'all') {
        const hasWebsite = business.site && business.site.trim() !== '';
        if (websiteFilter === 'yes') passesFilter = passesFilter && hasWebsite;
        if (websiteFilter === 'no') passesFilter = passesFilter && !hasWebsite;
      }

      return passesFilter;
    });
  }, [data, ratingFilter, reviewsFilter, websiteFilter]);

  return (
    <div className="w-full">
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4+">4+ Stars</option>
              <option value="3+">3+ Stars</option>
              <option value="<3">Less than 3 Stars</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reviews Count
            </label>
            <select
              value={reviewsFilter}
              onChange={(e) => setReviewsFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Reviews</option>
              <option value="50+">50+ Reviews</option>
              <option value="20+">20+ Reviews</option>
              <option value="10+">10+ Reviews</option>
              <option value="<10">Less than 10 Reviews</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Has Website
            </label>
            <select
              value={websiteFilter}
              onChange={(e) => setWebsiteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="yes">Has Website</option>
              <option value="no">No Website</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reviews
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Review Count
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Templates
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((business, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {business.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  {business.phone || 'N/A'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  {business.city || 'N/A'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  {business.site ? (
                    <a
                      href={business.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Visit Site
                    </a>
                  ) : (
                    <span className="text-gray-400">No Website</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  {business.reviews_link ? (
                    <a
                      href={business.reviews_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View Reviews
                    </a>
                  ) : (
                    <span className="text-gray-400">No Reviews</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="mr-1">{business.rating || '0'}</span>
                    <span className="text-yellow-400">★</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  {business.reviews || '0'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <a
                      href={`/plumbing1/${business.slug}`}
                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      Template 1
                    </a>
                    <a
                      href={`/plumbing2/${business.slug}`}
                      className="text-green-600 hover:text-green-800 underline text-xs"
                    >
                      Template 2
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No businesses found matching your filters.
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredData.length} of {data.length} businesses
      </div>
    </div>
  );
};

export default PlumbingTable;