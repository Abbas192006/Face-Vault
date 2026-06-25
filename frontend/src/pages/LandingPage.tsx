import { FeaturesBento } from '@/components/landing/FeaturesBento'
import { Footer } from '@/components/landing/Footer'
import { Hero } from '@/components/landing/Hero'
import { FinalCTA, PricingCards } from '@/components/landing/PricingCards'
import { TopNav } from '@/components/landing/TopNav'
import { WorkflowSteps } from '@/components/landing/WorkflowSteps'

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground font-body-md overflow-x-hidden min-h-screen">
      <TopNav />
      <Hero />
      <main>
        <FeaturesBento />
        <WorkflowSteps />
        <PricingCards />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
