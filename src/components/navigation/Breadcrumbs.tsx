'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  const breadcrumbs = paths.map((path, index) => {
    const href = `/${paths.slice(0, index + 1).join('/')}`;
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    
    return { href, label };
  });

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center space-x-2 text-sm text-white/70">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center space-x-2">
            <span>/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="text-white">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-white transition-colors">
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
