import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
      { title: 'Bhumi Drishti (ভূমি দৃষ্টি) — Agricultural Crop Predictor' },
      { name: 'description', content: 'Satellite and weather-based crop outcome predictor for Bangladeshi districts with voice, image, and GPS assistance.' }
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased bg-[#f4f6f2] text-[#1c2826] min-h-screen">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
