import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CloudUpload, Brain, UserSearch } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    icon: CloudUpload,
    title: '1. Upload',
    desc: 'Dump your entire event catalog. Our lightning-fast servers handle thousands of RAW or JPEG files instantly.',
  },
  {
    icon: Brain,
    title: '2. AI Groups',
    desc: 'The AI engine analyzes faces, objects, and lighting to automatically categorize every single image.',
  },
  {
    icon: UserSearch,
    title: '3. Guest Finds',
    desc: 'Guests scan a QR code, snap a selfie, and instantly see every photo they appear in.',
  },
]

export function WorkflowSteps() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('.workflow-step', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.7,
        ease: 'power2.out',
      })
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="py-16 bg-surface-container-lowest border-y border-primary/20"
    >
      <div className="max-w-container-max mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <h2 className="font-headline-lg text-headline-lg mb-2">The Workflow of the Future</h2>
          <p className="text-on-surface-variant font-body-md max-w-xl mx-auto">
            Three simple steps to revolutionize your delivery process.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.title} className="workflow-step text-center group">
              <div className="w-20 h-20 rounded-full bg-surface-container border border-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shimmer-border">
                <step.icon className="text-primary h-8 w-8" />
              </div>
              <h4 className="font-headline-md text-headline-md mb-2">{step.title}</h4>
              <p className="text-on-surface-variant">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
