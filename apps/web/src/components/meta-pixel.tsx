"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { trackMetaEvent } from "@/lib/meta-events";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Meta Pixel loader. Written by hand rather than via @next/third-parties
 * because that package only ships Google/GTM/YouTube at our Next 14 version.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!PIXEL_ID || !pathname) return;
    if (lastPathname.current === null) {
      // The loader sends the initial page view; route changes are handled below.
      lastPathname.current = pathname;
      return;
    }
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    trackMetaEvent("PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');var q=window.__flybridgeMetaQueue||[];window.__flybridgeMetaQueue=[];for(var i=0;i<q.length;i++){fbq('track',q[i].name,q[i].params);}`}
    </Script>
  );
}
