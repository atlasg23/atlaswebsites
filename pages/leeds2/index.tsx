import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PlumbingBusiness {
  id: number;
  name: string;
  phone: string;
  city: string;
  state: string;
  full_address: string;
  site: string;
  rating: string;
  reviews: string;
  reviews_link: string;
  slug: string;
  verified: string;
  email_1: string;
}

interface Props {
  businesses: PlumbingBusiness[];
  totalCount: number;
  currentPage: number;
}

export default function Leeds2({ businesses, totalCount }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews' | 'city'>('rating');
  const [filterWebsite, setFilterWebsite] = useState('all');
  const [filterVerified, setFilterVerified] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [filterReviews, setFilterReviews] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 100;

  // Filter and sort businesses
  const filteredBusinesses = useMemo(() => {
    let filtered = businesses.filter(business => {
      const matchesSearch = searchTerm === '' ||
        business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.full_address?.toLowerCase().includes(searchTerm.toLowerCase());


      let matchesWebsite = true;
      if (filterWebsite === 'yes') {
        matchesWebsite = business.site && business.site.trim() !== '';
      } else if (filterWebsite === 'no') {
        matchesWebsite = !business.site || business.site.trim() === '';
      }

      let matchesVerified = true;
      if (filterVerified === 'yes') {
        matchesVerified = business.verified === 'True';
      } else if (filterVerified === 'no') {
        matchesVerified = business.verified !== 'True';
      }

      let matchesRating = true;
      if (filterRating !== 'all') {
        const rating = parseFloat(business.rating || '0');
        switch(filterRating) {
          case '5': matchesRating = rating === 5; break;
          case '4+': matchesRating = rating >= 4; break;
          case '3+': matchesRating = rating >= 3; break;
          case '<3': matchesRating = rating < 3 && rating > 0; break;
        }
      }

      let matchesReviewCount = true;
      if (filterReviews !== 'all') {
        const reviews = parseInt(business.reviews || '0');
        switch(filterReviews) {
          case '100+': matchesReviewCount = reviews >= 100; break;
          case '50+': matchesReviewCount = reviews >= 50; break;
          case '20+': matchesReviewCount = reviews >= 20; break;
          case '10+': matchesReviewCount = reviews >= 10; break;
          case '<10': matchesReviewCount = reviews < 10; break;
        }
      }

      return matchesSearch && matchesWebsite && matchesVerified && matchesRating && matchesReviewCount;
    });

    // Sort businesses
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'rating':
          return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
        case 'reviews':
          return parseInt(b.reviews || '0') - parseInt(a.reviews || '0');
        case 'city':
          return (a.city || '').localeCompare(b.city || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [businesses, searchTerm, filterWebsite, filterVerified, filterRating, filterReviews, sortBy]);

  // Calculate pagination based on filtered results
  const totalFilteredCount = filteredBusinesses.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);

  // Get current page items
  const paginatedBusinesses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBusinesses.slice(startIndex, endIndex);
  }, [filteredBusinesses, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterWebsite, filterVerified, filterRating, filterReviews]);

  return (
    <>
      <Head>
        <title>Leeds 2.0 - Advanced Plumbing Directory</title>
        <meta name="description" content="Advanced directory of plumbing businesses with filtering and search" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Leeds 2.0</h1>
              <p className="text-blue-100 mt-1">Advanced Business Directory</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{totalCount} Total Businesses</p>
              <p className="text-blue-100">Page {currentPage} of {totalPages}</p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white shadow-md py-4 px-4 sticky top-0 z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>


            {/* Website Filter */}
            <div>
              <select
                value={filterWebsite}
                onChange={(e) => setFilterWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Website</option>
                <option value="yes">Has Website</option>
                <option value="no">No Website</option>
              </select>
            </div>

            {/* Verified Filter */}
            <div>
              <select
                value={filterVerified}
                onChange={(e) => setFilterVerified(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Verified</option>
                <option value="yes">Verified</option>
                <option value="no">Not Verified</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Rating</option>
                <option value="5">5 Stars</option>
                <option value="4+">4+ Stars</option>
                <option value="3+">3+ Stars</option>
                <option value="<3">&lt;3 Stars</option>
              </select>
            </div>

            {/* Reviews Filter */}
            <div>
              <select
                value={filterReviews}
                onChange={(e) => setFilterReviews(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Reviews</option>
                <option value="100+">100+</option>
                <option value="50+">50+</option>
                <option value="20+">20+</option>
                <option value="10+">10+</option>
                <option value="<10">&lt;10</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating">Sort by Rating</option>
                <option value="reviews">Sort by Reviews</option>
                <option value="name">Sort by Name</option>
                <option value="city">Sort by City</option>
              </select>
            </div>

          </div>
          {/* Results Count */}
          <div className="mt-3 text-right">
            <span className="text-sm text-gray-600">
              Showing {paginatedBusinesses.length} of {totalFilteredCount} filtered ({totalCount} total)
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="px-4 py-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">State</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Website</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reviews</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Verified</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Text</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Templates</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBusinesses.map((business, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="max-w-[200px] truncate" title={business.name}>
                          {business.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {business.phone ? (
                          <a
                            href={`tel:${business.phone}`}
                            className="text-blue-600 hover:underline font-mono text-xs"
                          >
                            {business.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {business.city || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {business.state || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {business.site ? (
                          <a
                            href={business.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View Site
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No Website</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {business.rating && parseFloat(business.rating) > 0 ? (
                          <div className="flex items-center">
                            <span className="font-medium">{parseFloat(business.rating).toFixed(1)}</span>
                            <span className="text-yellow-400 ml-1">★</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {business.reviews && parseInt(business.reviews) > 0 ? (
                          <div className="flex items-center gap-2">
                            <span>{business.reviews}</span>
                            {business.reviews_link && (
                              <a
                                href={business.reviews_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="View Reviews"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          business.verified === 'True'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {business.verified === 'True' ? '✓' : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {business.phone ? (
                          <a
                            href={`sms:${business.phone}?body=Check out our website: https://yoursite.com/plumbing4/${business.slug}`}
                            className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium transition-colors"
                            title="Text Business"
                          >
                            Text
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1 items-center">
                          <Link
                            href={`/plumbing4/${business.slug}`}
                            className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                            title="View Template"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginatedBusinesses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No businesses found matching your criteria
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page {currentPage} of {totalPages}</span>
                <span className="mx-2">|</span>
                <span>Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // Get ALL businesses at once for client-side filtering
  const { data: businesses, error, count } = await supabase
    .from('plumbing_leads')
    .select('id, name, phone, city, state, full_address, site, rating, reviews, reviews_link, slug, verified, email_1', { count: 'exact' })
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
  }

  return {
    props: {
      businesses: businesses || [],
      totalCount: count || 0,
      currentPage: 1
    }
  };
};