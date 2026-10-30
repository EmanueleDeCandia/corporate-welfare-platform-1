import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionBootstrap } from "@/components/session-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "RADICI | Welfare Aziendale Territoriale",
  description:
    "Piattaforma di welfare territoriale che riconverte i premi aziendali in soggiorni, cultura e gusto locale a KM 0.",
};

const sessionBootScript = `(function(){
  try {
    var k='radici_session';
    var h='x-radici-session';
    var u=new URLSearchParams(location.search).get('sid');
    if (u) sessionStorage.setItem(k,u);
    var t=sessionStorage.getItem(k);
    if (t) {
      var secure=location.protocol==='https:';
      document.cookie=k+'='+t+'; Path=/; Max-Age=1209600; '+(secure?'Secure; SameSite=None; Partitioned':'SameSite=Lax');
    }
    var orig=window.fetch;
    window.fetch=function(input, init){
      var token=null;
      try { token=sessionStorage.getItem(k); } catch (err) {}
      init=init?Object.assign({},init):{};
      var headers=new Headers(init.headers||{});
      if(token && !headers.has(h)) headers.set(h,token);
      init.headers=headers;
      if(!init.credentials) init.credentials='include';
      return orig.call(this,input,init);
    };
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <head>
        <script id="radici-session" dangerouslySetInnerHTML={{ __html: sessionBootScript }} />
      </head>
      <body className="bg-cream text-forest antialiased min-h-screen selection:bg-gold/30">
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
