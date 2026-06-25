import { SignInButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Solo Pro',
    price: '$49',
    period: '/month',
    features: ['5 Events Per Month', 'Unlimited Face Matching', 'Basic QR Integration'],
    cta: 'Select Plan',
    featured: false,
  },
  {
    name: 'Studio Elite',
    price: '$129',
    period: '/month',
    features: [
      'Unlimited Events',
      'Custom Branding',
      'Natural Language Search',
      'Priority AI Processing',
    ],
    cta: 'Get Started Now',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Dedicated Server', 'White-label Mobile App', '24/7 Concierge Support'],
    cta: 'Contact Sales',
    featured: false,
    id: 'enterprise',
  },
]

export function PricingCards() {
  return (
    <section id="pricing" className="py-16 px-6 lg:px-10 max-w-container-max mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg mb-2">Simple, Scalable Pricing</h2>
        <p className="text-on-surface-variant font-body-md">
          Choose the plan that fits your studio&apos;s volume.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: plan.featured ? 1.06 : 1.03, y: -4 }}
            id={plan.id}
            className={`glass-card p-10 rounded-xl flex flex-col relative ${
              plan.featured
                ? 'border-2 border-primary scanner-glow scale-105 z-10'
                : 'border border-primary/20'
            }`}
          >
            {plan.featured && (
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold">
                Most Popular
              </div>
            )}
            <span
              className={`font-bold text-xs uppercase mb-4 ${plan.featured ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              {plan.name}
            </span>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && <span className="text-on-surface-variant">{plan.period}</span>}
            </div>
            <ul className="space-y-3 mb-10 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-on-surface-variant">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.featured ? (
              <SignInButton mode="modal">
                <Button className="w-full">{plan.cta}</Button>
              </SignInButton>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  plan.name === 'Enterprise'
                    ? toast.info('Opening sales contact form...')
                    : toast.info('Redirecting to checkout...')
                }
              >
                {plan.cta}
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function FinalCTA() {
  return (
    <section className="py-16 mb-10 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto glass-card p-10 rounded-3xl text-center"
      >
        <h2 className="font-display text-headline-lg mb-4">Ready to Change How You Deliver?</h2>
        <p className="text-on-surface-variant font-body-lg mb-10 max-w-xl mx-auto">
          Join 2,000+ professional photographers who have automated their guest experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignInButton mode="modal">
            <Button size="lg" className="scanner-glow">
              Start Your Free Trial
            </Button>
          </SignInButton>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => toast.info('Opening demo scheduler...')}
          >
            Book a Demo
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
