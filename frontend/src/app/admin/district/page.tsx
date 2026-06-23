import { redirect } from 'next/navigation';

export default function AdminDistrictRedirect() {
  redirect('/district-admin/dashboard');
}
