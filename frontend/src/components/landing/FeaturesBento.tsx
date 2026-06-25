import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { ArrowRight, Filter, Search, Shield } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    span: 'md:col-span-8',
    tag: 'Intelligence',
    title: 'Real-Time Face Recognition',
    desc: 'Our AI indexes thousands of faces in milliseconds, ensuring every guest finds their perfect moments.',
    badges: ['99.9% Accuracy', 'Encrypted'],
    large: true,
  },
  {
    span: 'md:col-span-4',
    icon: Shield,
    title: 'Local Processing',
    desc: "Security is paramount. All facial data is processed on edge-secure servers, keeping your guests' privacy intact.",
  },
  {
    span: 'md:col-span-4',
    icon: Filter,
    title: 'Object Detection',
    desc: 'Automatically categorize shots by context: Ceremony, Reception, Speeches, or Details.',
  },
  {
    span: 'md:col-span-8',
    icon: Search,
    title: 'Natural Language Search',
    desc: 'Ask FaceVault anything: "Find photos of the bride\'s father during the toast."',
    nl: true,
  },
]

export function FeaturesBento() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const cards = gridRef.current?.children
      if (!cards) return

      gsap.from(cards, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
      })
    },
    { scope: sectionRef },
  )

  return (
    <section id="features" ref={sectionRef} className="py-16 px-6 lg:px-10 max-w-container-max mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg mb-2">Unmatched Technical Precision</h2>
        <p className="text-on-surface-variant font-body-md max-w-xl mx-auto">
          Powered by next-generation neural networks for instant delivery.
        </p>
      </div>
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            whileHover={{ scale: 1.01, rotateX: 2, rotateY: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`${feature.span} glass-card p-6 rounded-xl border border-primary/20 overflow-hidden`}
          >
            {feature.tag && (
              <span className="text-primary font-bold text-xs tracking-widest uppercase mb-1 block">
                {feature.tag}
              </span>
            )}
            {feature.icon && (
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
            )}
            <h3 className="font-headline-md text-headline-md mb-2">{feature.title}</h3>
            <p className="text-on-surface-variant">{feature.desc}</p>
            {feature.badges && (
              <div className="flex gap-2 mt-4">
                {feature.badges.map((b) => (
                  <span
                    key={b}
                    className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
            {feature.nl && (
              <div className="glass-card bg-black/40 border-primary/20 p-4 rounded-full flex items-center gap-4 mt-6">
                <Search className="h-5 w-5 text-primary shrink-0" />
                <span className="text-on-surface-variant italic text-sm truncate">
                  &quot;Find photos of the mother of the bride crying...&quot;
                </span>
                <span className="ml-auto bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-bold shrink-0">
                  AI Active
                </span>
              </div>
            )}
            {!feature.large && !feature.nl && (
              <a
                href="#"
                className="text-primary font-bold flex items-center gap-1 mt-6 text-sm"
              >
                Learn More <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
