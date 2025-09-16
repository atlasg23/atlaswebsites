import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { PlumbingBusiness } from "../lib/supabaseReader";
import { getAllBusinessesSummary } from "../lib/supabaseOptimized";
import PlumbingTable from "../components/PlumbingTable";
import { GetServerSideProps } from "next";

interface Props {
  businesses: PlumbingBusiness[];
  totalCount: number;
}

const Home: NextPage<Props> = ({ businesses }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Plumbing Business Directory</title>
        <meta name="description" content="Directory of plumbing businesses" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="py-12 px-6">
        <div className="w-full px-4">
          <h1 className="text-4xl font-bold text-center mb-4">
            Plumbing Business Directory
          </h1>
          <p className="text-xl text-gray-600 text-center mb-8">
            Browse and filter plumbing businesses in your area
          </p>

          <div className="text-center mb-8">
            <Link
              href="/leeds2"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              View Leeds 2.0 - Advanced Directory
            </Link>
          </div>

          <PlumbingTable data={businesses} />
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  // Load only first 100 businesses for better performance
  const { businesses, total } = await getAllBusinessesSummary(100, 0);

  return {
    props: {
      businesses: businesses as any, // Cast for compatibility with PlumbingTable
      totalCount: total
    }
  };
};

export default Home;