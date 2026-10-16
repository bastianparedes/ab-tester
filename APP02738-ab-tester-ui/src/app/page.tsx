import { redirect } from 'next/navigation';
import constants from '@/config/constants';

const Page = () => {
  const redirectUrl = constants.pages.logIn();
  redirect(redirectUrl);
};

export default Page;
