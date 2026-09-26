import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./ServicesSection.css";

gsap.registerPlugin(useGSAP);

const EASE_FAST_FLUID = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_LEAD_STRETCH = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_ELASTIC_SNAP = "cubic-bezier(0.34, 1.25, 0.64, 1)";

const SERVICES = [
  {
    number: "(01)",
    title: "Web Design",
    image:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000&auto=format&fit=crop",
    alt: "Web Design",
  },
  {
    number: "(02)",
    title: "Framer Development",
    image:
      "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=1000&auto=format&fit=crop",
    alt: "Framer Development",
  },
  {
    number: "(03)",
    title: "Branding",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop",
    alt: "Branding",
  },
];

export default function ServicesSection() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const items = gsap.utils.toArray(".service-item", root);
      const images = gsap.utils.toArray(".image-slide img", root);
      const strip = root.querySelector(".image-strip");
      const indicator = root.querySelector(".active-indicator");
      const backdrop = root.querySelector(".hover-backdrop");
      if (!items.length || !strip || !indicator || !backdrop) return;

      let activeIndex = 0;
      const linePos = { top: 0, bottom: 0 };
      const bgPos = { top: 0, bottom: 0 };

      const renderIndicator = () => {
        gsap.set(indicator, {
          top: linePos.top,
          height: Math.max(0, linePos.bottom - linePos.top),
        });
      };

      const renderBackdrop = () => {
        gsap.set(backdrop, {
          top: bgPos.top,
          height: Math.max(0, bgPos.bottom - bgPos.top),
        });
      };

      const syncBounds = (index) => {
        const item = items[index];
        if (!item) return;
        const height = item.getBoundingClientRect().height;
        linePos.top = item.offsetTop;
        linePos.bottom = item.offsetTop + height;
        bgPos.top = item.offsetTop;
        bgPos.bottom = item.offsetTop + height;
        renderIndicator();
        renderBackdrop();
      };

      const init = () => {
        syncBounds(activeIndex);
        gsap.set(indicator, { width: 4 });
        gsap.set(strip, { yPercent: 0 });
        images.forEach((img, idx) => {
          gsap.set(img, { scale: idx === 0 ? 1 : 1.06 });
        });
      };

      const updateActiveElements = (targetItem, isHovered = false) => {
        if (reduced) {
          syncBounds(parseInt(targetItem.dataset.index, 10));
          return;
        }

        const targetTop = targetItem.offsetTop;
        const targetBottom =
          targetTop + targetItem.getBoundingClientRect().height;
        const isMovingDown = targetTop > linePos.top;

        gsap.to(indicator, {
          width: isHovered ? 5 : 4,
          duration: 0.22,
          ease: EASE_FAST_FLUID,
          overwrite: "auto",
        });

        if (isMovingDown) {
          gsap.to(linePos, {
            bottom: targetBottom,
            duration: 0.26,
            ease: EASE_LEAD_STRETCH,
            onUpdate: renderIndicator,
            overwrite: "auto",
          });
          gsap.to(bgPos, {
            bottom: targetBottom,
            duration: 0.28,
            ease: EASE_LEAD_STRETCH,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
          gsap.to(linePos, {
            top: targetTop,
            duration: 0.38,
            ease: EASE_ELASTIC_SNAP,
            onUpdate: renderIndicator,
            overwrite: "auto",
          });
          gsap.to(bgPos, {
            top: targetTop,
            duration: 0.4,
            ease: EASE_ELASTIC_SNAP,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
        } else {
          gsap.to(linePos, {
            top: targetTop,
            duration: 0.26,
            ease: EASE_LEAD_STRETCH,
            onUpdate: renderIndicator,
            overwrite: "auto",
          });
          gsap.to(bgPos, {
            top: targetTop,
            duration: 0.28,
            ease: EASE_LEAD_STRETCH,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
          gsap.to(linePos, {
            bottom: targetBottom,
            duration: 0.38,
            ease: EASE_ELASTIC_SNAP,
            onUpdate: renderIndicator,
            overwrite: "auto",
          });
          gsap.to(bgPos, {
            bottom: targetBottom,
            duration: 0.4,
            ease: EASE_ELASTIC_SNAP,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
        }
      };

      const scrollToImage = (targetIndex) => {
        if (targetIndex === activeIndex) return;

        if (reduced) {
          gsap.set(strip, { yPercent: -(targetIndex * 100) });
          images.forEach((img, idx) => {
            gsap.set(img, { scale: idx === targetIndex ? 1 : 1.06 });
          });
          activeIndex = targetIndex;
          return;
        }

        gsap.to(strip, {
          yPercent: -(targetIndex * 100),
          duration: 0.32,
          ease: EASE_FAST_FLUID,
          overwrite: "auto",
        });

        images.forEach((img, idx) => {
          gsap.to(img, {
            scale: idx === targetIndex ? 1 : 1.06,
            duration: 0.36,
            ease: EASE_FAST_FLUID,
            overwrite: "auto",
          });
        });

        activeIndex = targetIndex;
      };

      const cleanups = items.map((item) => {
        const index = parseInt(item.dataset.index, 10);
        const content = item.querySelector(".service-item__content");

        const onEnter = () => {
          items.forEach((el) => el.classList.remove("is-active"));
          item.classList.add("is-active");
          updateActiveElements(item, true);
          scrollToImage(index);

          if (!reduced && content) {
            gsap.to(content, {
              x: 6,
              duration: 0.28,
              ease: EASE_FAST_FLUID,
              overwrite: "auto",
            });
          }
        };

        const onLeave = () => {
          if (!reduced && content) {
            gsap.to(content, {
              x: 0,
              duration: 0.28,
              ease: EASE_FAST_FLUID,
              overwrite: "auto",
            });
          }

          gsap.to(indicator, {
            width: 4,
            duration: 0.22,
            ease: EASE_FAST_FLUID,
            overwrite: "auto",
          });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);
        item.addEventListener("focus", onEnter);
        item.addEventListener("blur", onLeave);

        return () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
          item.removeEventListener("focus", onEnter);
          item.removeEventListener("blur", onLeave);
        };
      });

      const onResize = () => syncBounds(activeIndex);

      init();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        cleanups.forEach((fn) => fn());
      };
    },
    { scope: rootRef }
  );

  return (
    <section className="services-section" ref={rootRef} id="services">
      <div className="services-container">
        <div className="services-grid">
          <div className="services-menu-wrapper">
            <div className="hover-backdrop" aria-hidden="true" />
            <div className="active-indicator" aria-hidden="true" />
            <ul className="services-list">
              {SERVICES.map((service, index) => (
                <li
                  key={service.title}
                  className={`service-item${index === 0 ? " is-active" : ""}`}
                  data-index={index}
                  tabIndex={0}
                >
                  <div className="service-item__content">
                    <span className="service-item__number">{service.number}</span>
                    <h3 className="service-item__title">{service.title}</h3>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="image-stage">
            <div className="image-strip">
              {SERVICES.map((service, index) => (
                <div
                  key={service.title}
                  className="image-slide"
                  data-index={index}
                >
                  <img src={service.image} alt={service.alt} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
