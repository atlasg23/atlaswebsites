import { GetServerSideProps } from "next";

const Home = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/leeds2',
      permanent: false,
    },
  };
};

export default Home;