import { useEffect, useState } from 'react'
import { SignInButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#enterprise', label: 'Enterprise' },
]

export function TopNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'bg-surface/90 backdrop-blur-xl border-primary/30 shadow-lg shadow-primary/5'
          : 'bg-surface/70 backdrop-blur-xl border-primary/20',
      )}
    >
      <nav className="flex justify-between items-center px-6 lg:px-10 py-4 w-full max-w-container-max mx-auto">
        <div className="font-headline-md text-headline-md font-extrabold tracking-tighter">
          <span style={{ background: 'linear-gradient(90deg, #00F5D4, #00BBF9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Face</span>
          <span className="text-on-surface">Vault</span>
          <span style={{ background: 'linear-gradient(90deg, #00BBF9, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> AI</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-body-md relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <Button variant="ghost" className="hidden md:inline-flex">
              Login
            </Button>
          </SignInButton>
          <SignInButton mode="modal">
            <Button>Get Started</Button>
          </SignInButton>
        </div>
      </nav>
    </motion.header>
  )
}
