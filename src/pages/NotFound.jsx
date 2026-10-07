import { Button, EmptyState } from '../components/ui'
import { Compass } from 'lucide-react'
import { useAuth } from '../context/Providers'

export default function NotFound() {
  const { user } = useAuth()
  const homePath = user?.accountType === 'vendor' ? '/app/vendor' : (user?.isAdmin || user?.role === 'admin') ? '/app/admin' : '/app'
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <EmptyState icon={Compass} title="Page not found" text="That page doesn't exist or has moved." action={<Button to={homePath}>Go to STEW</Button>} />
    </div>
  )
}
