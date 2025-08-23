import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to educator dashboard (main entry point for the app)
  redirect('/educator')
}
