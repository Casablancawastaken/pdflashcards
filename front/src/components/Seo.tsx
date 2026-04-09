import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  image?: string;
  jsonLd?: Record<string, unknown> | null;
}

const ensureMeta = (selector: string, create: () => HTMLMetaElement) => {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

const ensureLink = (selector: string, create: () => HTMLLinkElement) => {
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

const Seo = ({ title, description, canonical, noindex = false, image, jsonLd }: SeoProps) => {
  useEffect(() => {
    document.title = title;

    const desc = ensureMeta('meta[name="description"]', () => {
      const m = document.createElement("meta");
      m.name = "description";
      return m;
    });
    desc.content = description;

    const robots = ensureMeta('meta[name="robots"]', () => {
      const m = document.createElement("meta");
      m.name = "robots";
      return m;
    });
    robots.content = noindex ? "noindex, nofollow" : "index, follow";

    const url = canonical || window.location.href;

    const canonicalLink = ensureLink('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.rel = "canonical";
      return l;
    });
    canonicalLink.href = url;

    const ogTitle = ensureMeta('meta[property="og:title"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:title");
      return m;
    });
    ogTitle.content = title;

    const ogDesc = ensureMeta('meta[property="og:description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:description");
      return m;
    });
    ogDesc.content = description;

    const ogType = ensureMeta('meta[property="og:type"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:type");
      return m;
    });
    ogType.content = "website";

    const ogUrl = ensureMeta('meta[property="og:url"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:url");
      return m;
    });
    ogUrl.content = url;

    const ogImage = ensureMeta('meta[property="og:image"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:image");
      return m;
    });
    ogImage.content = image || `${window.location.origin}/vite.svg`;

    const twCard = ensureMeta('meta[name="twitter:card"]', () => {
      const m = document.createElement("meta");
      m.name = "twitter:card";
      return m;
    });
    twCard.content = "summary_large_image";

    let script = document.getElementById("jsonld-seo");
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = "jsonld-seo";
        script.setAttribute("type", "application/ld+json");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, canonical, noindex, image, jsonLd]);

  return null;
};

export default Seo;