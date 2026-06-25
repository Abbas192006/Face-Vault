import { Globe, Mail, Share2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest py-12 border-t border-primary/20">
      <div className="max-w-container-max mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <div className="font-headline-md text-headline-md font-bold text-on-surface tracking-tighter mb-4">
            FaceVault
          </div>
          <p className="text-on-surface-variant text-sm">
            The standard in AI-powered event delivery solutions.
          </p>
        </div>
        {[
          { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
          { title: 'Company', links: ['About Us', 'Blog', 'Careers'] },
          { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Data Processing'] },
        ].map((col) => (
          <div key={col.title}>
            <h5 className="font-bold mb-4">{col.title}</h5>
            <ul className="space-y-2 text-on-surface-variant text-sm">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-container-max mx-auto px-6 lg:px-10 mt-10 pt-10 border-t border-primary/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-on-surface-variant text-xs">© 2024 FaceVault AI. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="text-on-surface-variant hover:text-primary">
            <Share2 className="h-5 w-5" />
          </a>
          <a href="#" className="text-on-surface-variant hover:text-primary">
            <Globe className="h-5 w-5" />
          </a>
          <a href="#" className="text-on-surface-variant hover:text-primary">
            <Mail className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
