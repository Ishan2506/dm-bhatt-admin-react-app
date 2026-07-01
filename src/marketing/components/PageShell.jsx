import { h, Fragment } from 'preact';
import { useEffect } from 'preact/hooks';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';

/** Sets SEO title/description and renders navbar + page + footer. */
export function PageShell({ current, title, description, children }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
      }
      m.setAttribute('content', description);
    }
    window.scrollTo({ top: 0 });
  }, [title, description]);

  return (
    <div class="mkt">
      <Navbar current={current} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export default PageShell;
