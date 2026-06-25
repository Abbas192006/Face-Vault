import { Suspense, lazy, useRef } from 'react'
import { SignInButton } from '@clerk/clerk-react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HeroScene = lazy(() => import('@/components/three/HeroScene'))

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from(headlineRef.current, { y: 60, opacity: 0, duration: 1, delay: 0.3 })
        .from(subRef.current, { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
        .from(ctaRef.current?.children ?? [], { y: 20, opacity: 0, stagger: 0.15, duration: 0.6 }, '-=0.4')
        .from(scrollRef.current, { opacity: 0, y: -10, duration: 0.8 }, '-=0.2')
    },
    { scope: containerRef },
  )

  return (
    <div
      ref={containerRef}
      className="relative pt-10 pb-10 flex flex-col items-center justify-center min-h-[90vh]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      <Suspense
        fallback={
          <div className="absolute inset-0 -z-20 bg-gradient-radial from-primary/10 to-background" />
        }
      >
        <HeroScene />
      </Suspense>

      <div className="relative z-10 w-full max-w-4xl px-4 text-center">
        <div className="glass-card p-10 rounded-xl border border-primary/20 inline-block mb-6">
          <h1
            ref={headlineRef}
            className="font-display text-display text-on-surface mb-4"
          >
            The Future of Event
            <br className="hidden md:block" /> Photography is Here.
          </h1>
          <p
            ref={subRef}
            className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10"
          >
            AI-powered face recognition for weddings and events. Guests find their photos in
            seconds.
          </p>
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignInButton mode="modal">
              <Button size="lg" className="scanner-glow">
                Start Your Free Trial
              </Button>
            </SignInButton>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="text-primary h-10 w-10" />
      </div>
    </div>
  )
}
