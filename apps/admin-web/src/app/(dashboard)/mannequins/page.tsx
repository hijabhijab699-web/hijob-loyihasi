import { redirect } from 'next/navigation';

// Standalone page retired — the mannequin uploader now lives at the top of
// /dev-ai, next to the style-job queue it feeds. Keep this redirect so any
// bookmark still lands in the right place.
export default function MannequinsPage() {
  redirect('/dev-ai');
}
