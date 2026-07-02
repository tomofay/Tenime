import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const PROXY_ORIGIN = "https://desustream.me";
const INTERCEPTOR = `
<script>
(function(){
if(window._pp) return;
window._pp=1;
var P='/api/mirror/proxy';
function toP(u){
  if(!u||!/desustream/.test(u))return u;
  var n=u.replace('http://','').replace('https://','');
  var s=n.indexOf('/');
  return P+(s<0?'':n.slice(s));
}

// Patch iframe.src setter
var d=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'src');
if(d&&d.set){
  var orig=d.set;
  Object.defineProperty(HTMLIFrameElement.prototype,'src',{
    get:d.get,configurable:true,
    set:function(v){orig.call(this,toP(v));}
  });
}

// Patch setAttribute
var sa=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(n,v){
  if(n==='src')v=toP(v);
  return sa.call(this,n,v);
};

// Patch window.open
var wo=window.open;
window.open=function(u){return wo(toP(u));};

// Intercept fetch — log googlevideo requests
var ofetch=window.fetch;
window.fetch=function(url,opts){
  var u=typeof url==='string'?url:(url instanceof Request?url.url:url+'');
  console.log('[proxy] fetch:',u);
  if(/googlevideo\.com\/(videoplayback|videodownload)/.test(u)){
    console.log('[proxy] 🎬 VIDEO FETCHED:',u);
  }
  return ofetch.call(this,url,opts);
};

// Intercept XMLHttpRequest
var OXHR=window.XMLHttpRequest;
window.XMLHttpRequest=function(){
  var xhr=new OXHR();
  var oopen=xhr.open;
  xhr.open=function(method,url){
    console.log('[proxy] XHR:',url);
    if(/googlevideo\.com\/(videoplayback|videodownload)/.test(url)){
      console.log('[proxy] 🎬 VIDEO XHR:',url);
    }
    return oopen.apply(this,arguments);
  };
  return xhr;
};

// Observe DOM for dynamic iframes
new MutationObserver(function(ms){
  ms.forEach(function(m){
    m.addedNodes.forEach(function(n){
      if(n.nodeName==='IFRAME'&&n.src)n.src=toP(n.src);
      if(n.querySelectorAll){
        n.querySelectorAll('iframe').forEach(function(f){
          if(f.src)f.src=toP(f.src);
        });
      }
    });
  });
}).observe(document.documentElement,{childList:true,subtree:true});

console.log('[proxy] interceptor active');
})();
</script>
`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await params;
  const { searchParams } = new URL(request.url);

  const path = segments.length > 0 ? segments.join("/") : "";
  const qs = searchParams.toString();
  const targetUrl = `${PROXY_ORIGIN}/${path}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
        Referer: "https://otakudesu.blog/",
        "Accept-Encoding": "identity",
      },
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    for (const [key, value] of res.headers) {
      const lower = key.toLowerCase();
      if (
        lower === "content-security-policy" ||
        lower === "content-security-policy-report-only" ||
        lower === "x-frame-options" ||
        lower === "content-encoding" ||
        lower === "transfer-encoding"
      ) continue;
      if (lower === "location") {
        responseHeaders.set(key, makeProxyUrl(value));
        continue;
      }
      responseHeaders.set(key, value);
    }

    if (res.status >= 300 && res.status < 400) {
      return NextResponse.redirect(new URL(responseHeaders.get("location") || "/", request.url));
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
      const body = await res.text();
      const $ = cheerio.load(body);

      $("base").attr("href", "/api/mirror/proxy/");

      for (const attr of ["src", "href", "srcset", "data-src", "data-url", "action"]) {
        $(`[${attr}]`).each((_, el) => {
          const val = $(el).attr(attr);
          if (val) $(el).attr(attr, rewriteUrl(val));
        });
      }

      $("[style]").each((_, el) => {
        const style = $(el).attr("style");
        if (style) $(el).attr("style", rewriteCssUrl(style));
      });

      $("style").each((_, el) => {
        const text = $(el).text();
        if (text) $(el).text(rewriteCssUrl(text));
      });

      $("head").prepend('<base href="/api/mirror/proxy/">');
      $('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="X-Frame-Options"]').remove();

      const html = $.html();
      const withInterceptor = html.replace("</body>", `${INTERCEPTOR}</body>`);

      responseHeaders.set("Content-Type", "text/html; charset=utf-8");
      return new NextResponse(withInterceptor, { status: res.status, headers: responseHeaders });
    }

    if (contentType.includes("text/css")) {
      const body = await res.text();
      responseHeaders.set("Content-Type", "text/css; charset=utf-8");
      return new NextResponse(rewriteCssUrl(body), { status: res.status, headers: responseHeaders });
    }

    if (contentType.includes("javascript") || contentType.includes("text/js")) {
      const body = await res.text();
      responseHeaders.set("Content-Type", contentType);
      return new NextResponse(rewriteJsUrl(body), { status: res.status, headers: responseHeaders });
    }

    return new NextResponse(res.body, { status: res.status, headers: responseHeaders });
  } catch (e) {
    return new NextResponse(`Proxy error: ${(e as Error).message}`, { status: 502 });
  }
}

function rewriteUrl(val: string): string {
  if (!val) return val;
  if (val.match(/^https?:\/\/desustream\.me\b/i)) {
    const u = new URL(val);
    return `/api/mirror/proxy${u.pathname}${u.search}`;
  }
  if (val.startsWith("/")) return `/api/mirror/proxy${val}`;
  return val;
}

function rewriteCssUrl(css: string): string {
  return css.replace(
    /url\(["']?(https?:\/\/desustream\.me\/[^)"']+)["']?\)/gi,
    (_m: string, u: string) => {
      const parsed = new URL(u);
      return `url(/api/mirror/proxy${parsed.pathname}${parsed.search})`;
    }
  );
}

function rewriteJsUrl(js: string): string {
  return js
    .replace(/(["'`])(https?:\/\/desustream\.me\/[^"'`\s]+)(["'`])/gi,
      (_m: string, q1: string, u: string, q2: string) => {
        const parsed = new URL(u);
        return `${q1}/api/mirror/proxy${parsed.pathname}${parsed.search}${q2}`;
      }
    )
    .replace(/["'`](\/dstream\/[^"'`\s]+)["'`]/gi,
      (_m: string, p: string) => `"/api/mirror/proxy${p}"`
    );
}

function makeProxyUrl(url: string): string {
  if (!url) return "/";
  if (url.match(/^https?:\/\/desustream\.me\b/i)) {
    const u = new URL(url);
    return `/api/mirror/proxy${u.pathname}${u.search}`;
  }
  return url;
}
