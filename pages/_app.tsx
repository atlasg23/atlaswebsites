import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/next'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize Matomo tracking
    var _mtm = (window as any)._mtm = (window as any)._mtm || [];
    _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
    var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
    g.async = true;
    g.src = 'https://cdn.matomo.cloud/atlasgrowthai.matomo.cloud/container_j6kFs2Ww.js';
    s.parentNode?.insertBefore(g, s);
  }, [])

  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}

export default MyApp
