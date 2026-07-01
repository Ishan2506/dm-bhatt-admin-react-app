import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Scroll-reveal wrapper. Adds `in` class when element enters the viewport.
 * Lightweight — uses a single IntersectionObserver, no animation library.
 */
export function Reveal({ children, className = '', variant = 'reveal', delay, as = 'div', once = true, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.unobserve(e.target);
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const Tag = as;
  return (
    <Tag
      ref={ref}
      class={`${variant} ${shown ? 'in' : ''} ${className}`}
      data-delay={delay}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
