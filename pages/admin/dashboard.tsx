import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Lead {
  slug: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  rating: string;
  reviews: string;
  website: string;
  email_1: string;
}

interface LeadStatus {
  lead_slug: string;
  status: string;
  call_notes: string;
  website_sent: boolean;
  website_sent_date: string;
  follow_up_date: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<Map<string, LeadStatus>>(new Map());
  const [archivedSlugs, setArchivedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalAction, setModalAction] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [archiveReason, setArchiveReason] = useState('not_interested');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      // Fetch all leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('plumbing_leads')
        .select('*')
        .order('name');

      if (leadsError) throw leadsError;

      // Fetch lead statuses
      const { data: statusData, error: statusError } = await supabase
        .from('lead_status')
        .select('*');

      if (statusError) throw statusError;

      // Fetch archived leads
      const { data: archiveData, error: archiveError } = await supabase
        .from('lead_archive')
        .select('lead_slug');

      if (archiveError) throw archiveError;

      // Create maps for quick lookup
      const statusMap = new Map(statusData?.map(s => [s.lead_slug, s]) || []);
      const archiveSet = new Set(archiveData?.map(a => a.lead_slug) || []);

      setLeads(leadsData || []);
      setLeadStatuses(statusMap);
      setArchivedSlugs(archiveSet);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (lead: Lead, action: string) => {
    setSelectedLead(lead);
    setModalAction(action);
    setNotes('');
    setFollowUpDate('');
    setShowModal(true);
  };

  const saveLeadStatus = async () => {
    if (!selectedLead) return;

    const adminUser = localStorage.getItem('adminUser');

    try {
      if (modalAction === 'archive') {
        // Archive the lead
        await supabase.from('lead_archive').insert({
          lead_slug: selectedLead.slug,
          business_name: selectedLead.name,
          phone: selectedLead.phone,
          city: selectedLead.city,
          reason: archiveReason,
          notes: notes,
          archived_by: adminUser
        });

        // Remove from lead_status if exists
        await supabase.from('lead_status').delete().eq('lead_slug', selectedLead.slug);

      } else {
        // Update or create lead status
        const statusUpdate: any = {
          lead_slug: selectedLead.slug,
          call_notes: notes,
          updated_by: adminUser,
          last_contact_date: new Date().toISOString()
        };

        if (modalAction === 'warm') {
          statusUpdate.status = 'warm';
        } else if (modalAction === 'cold') {
          statusUpdate.status = 'cold';
        } else if (modalAction === 'follow_up') {
          statusUpdate.status = 'follow_up';
          statusUpdate.follow_up_date = followUpDate;
        } else if (modalAction === 'website_sent') {
          statusUpdate.website_sent = true;
          statusUpdate.website_sent_date = new Date().toISOString();
        }

        await supabase.from('lead_status').upsert(statusUpdate, { onConflict: 'lead_slug' });
      }

      // Refresh data
      fetchLeads();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving lead status:', error);
      alert('Error saving status. Please try again.');
    }
  };

  const getFilteredLeads = () => {
    return leads.filter(lead => {
      // Skip archived leads
      if (archivedSlugs.has(lead.slug)) return false;

      const status = leadStatuses.get(lead.slug);

      switch (filter) {
        case 'warm':
          return status?.status === 'warm';
        case 'cold':
          return status?.status === 'cold';
        case 'follow_up':
          return status?.status === 'follow_up';
        case 'website_sent':
          return status?.website_sent === true;
        case 'untouched':
          return !status;
        default:
          return true;
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const filteredLeads = getFilteredLeads();

  return (
    <>
      <Head>
        <title>Admin Dashboard - Lead Management</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Management Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {localStorage.getItem('adminUser')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                All Active ({leads.filter(l => !archivedSlugs.has(l.slug)).length})
              </button>
              <button
                onClick={() => setFilter('untouched')}
                className={`px-4 py-2 rounded-lg ${filter === 'untouched' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Untouched ({leads.filter(l => !archivedSlugs.has(l.slug) && !leadStatuses.has(l.slug)).length})
              </button>
              <button
                onClick={() => setFilter('warm')}
                className={`px-4 py-2 rounded-lg ${filter === 'warm' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Warm ({Array.from(leadStatuses.values()).filter(s => s.status === 'warm').length})
              </button>
              <button
                onClick={() => setFilter('cold')}
                className={`px-4 py-2 rounded-lg ${filter === 'cold' ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Cold ({Array.from(leadStatuses.values()).filter(s => s.status === 'cold').length})
              </button>
              <button
                onClick={() => setFilter('follow_up')}
                className={`px-4 py-2 rounded-lg ${filter === 'follow_up' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Follow Up ({Array.from(leadStatuses.values()).filter(s => s.status === 'follow_up').length})
              </button>
              <button
                onClick={() => setFilter('website_sent')}
                className={`px-4 py-2 rounded-lg ${filter === 'website_sent' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Website Sent ({Array.from(leadStatuses.values()).filter(s => s.website_sent).length})
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Archived: {archivedSlugs.size} leads
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-8">Loading leads...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => {
                      const status = leadStatuses.get(lead.slug);
                      return (
                        <tr key={lead.slug} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              <div className="text-xs text-gray-500">⭐ {lead.rating} ({lead.reviews} reviews)</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.city}, {lead.state}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{lead.phone}</div>
                            <div className="text-xs text-gray-500">{lead.email_1}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {status && (
                              <div>
                                {status.status && (
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    status.status === 'warm' ? 'bg-green-100 text-green-800' :
                                    status.status === 'cold' ? 'bg-blue-100 text-blue-800' :
                                    status.status === 'follow_up' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {status.status}
                                  </span>
                                )}
                                {status.website_sent && (
                                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                    Website sent
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="max-w-xs truncate">{status?.call_notes || '-'}</div>
                            {status?.follow_up_date && (
                              <div className="text-xs text-yellow-600">Follow up: {new Date(status.follow_up_date).toLocaleDateString()}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleAction(lead, 'archive')}
                                className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs"
                                title="Not Interested / Bad Fit"
                              >
                                Not Interested
                              </button>
                              <button
                                onClick={() => handleAction(lead, 'warm')}
                                className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs"
                              >
                                Warm
                              </button>
                              <button
                                onClick={() => handleAction(lead, 'cold')}
                                className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
                              >
                                Cold
                              </button>
                              <button
                                onClick={() => handleAction(lead, 'follow_up')}
                                className="px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-xs"
                              >
                                Follow Up
                              </button>
                              <button
                                onClick={() => handleAction(lead, 'website_sent')}
                                className="px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded text-xs"
                              >
                                Website Sent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {modalAction === 'archive' ? 'Archive Lead' :
               modalAction === 'warm' ? 'Mark as Warm Lead' :
               modalAction === 'cold' ? 'Mark as Cold Lead' :
               modalAction === 'follow_up' ? 'Set Follow Up' :
               'Mark Website Sent'}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">{selectedLead.name}</p>
              <p className="text-xs text-gray-500">{selectedLead.phone}</p>
            </div>

            {modalAction === 'archive' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <select
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="not_interested">Not Interested</option>
                  <option value="bad_fit">Bad Fit</option>
                  <option value="out_of_service_area">Out of Service Area</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="no_answer">No Answer</option>
                  <option value="wrong_number">Wrong Number</option>
                </select>
              </div>
            )}

            {modalAction === 'follow_up' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow Up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add notes about this interaction..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveLeadStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}