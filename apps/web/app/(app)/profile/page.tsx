import { redirect } from 'next/navigation';

// /profile redirects to /profile/me or login — handled client-side
export default function ProfileIndexPage() {
  redirect('/login');
}
