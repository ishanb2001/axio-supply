import { useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import DynamicNav from "./DynamicNav";
import FaqAccordion from "./FaqAccordion";
import FeatureCards from "./FeatureCards";
import FloatTiles from "./FloatTiles";
import ExpandCards from "./ExpandCards";
import axioBrandingBg from "../assets/axio-branding-bg.png";
import "./HomePage.css";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);

const ROTATING_WORDS = ["platform", "environment", "ecosystem"];
const SLIDE_EASE = CustomEase.create("homeEaseInOut", "0.4,0,0.2,1");
const REVEAL_EASE = "power4.out";
const TICKER_SCROLL_EASE = CustomEase.create("tickerScrollEase", "0.76,0,0.24,1");
const CINEMA_EASE = CustomEase.create("cinemaEase", "0.65,0,0.35,1");

function RotatingWord({ words = ROTATING_WORDS }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const sizer = root.querySelector(".rotating-text__sizer");
      const wordEls = gsap.utils.toArray(".rotating-text__word", root);
      if (!sizer || wordEls.length < 1) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hold = 3.6;
      const inDuration = 0.75;
      const outDuration = 0.6;
      let activeIndex = 0;
      let loop;
      let tl;

      const measure = (text) => {
        const prev = sizer.textContent;
        sizer.textContent = text;
        const width = Math.ceil(sizer.scrollWidth);
        sizer.textContent = prev;
        return width;
      };

      const fitWidth = (text, duration = 0) => {
        const width = measure(text);
        if (duration) {
          return gsap.to(root, {
            width,
            duration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          });
        }
        gsap.set(root, { width });
        return null;
      };

      sizer.textContent = words[0];
      gsap.set(wordEls, { yPercent: 110, autoAlpha: 0 });
      gsap.set(wordEls[0], { yPercent: 0, autoAlpha: 1 });
      fitWidth(words[0]);

      if (reduced || wordEls.length < 2) return;

      const showNext = () => {
        const nextIndex = (activeIndex + 1) % wordEls.length;
        const prev = wordEls[activeIndex];
        const next = wordEls[nextIndex];

        tl = gsap.timeline({
          onComplete: () => {
            activeIndex = nextIndex;
            sizer.textContent = words[activeIndex];
            fitWidth(words[activeIndex]);
            loop = gsap.delayedCall(hold, showNext);
          },
        });

        tl.to(
          prev,
          {
            yPercent: -110,
            autoAlpha: 0,
            duration: outDuration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          },
          0
        );

        tl.fromTo(
          next,
          { yPercent: 110, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: inDuration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          },
          0
        );

        tl.to(
          root,
          {
            width: measure(words[nextIndex]),
            duration: inDuration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          },
          0
        );
      };

      loop = gsap.delayedCall(hold, showNext);

      const onResize = () => fitWidth(words[activeIndex]);
      window.addEventListener("resize", onResize);

      return () => {
        loop?.kill();
        tl?.kill();
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: rootRef, dependencies: [words] }
  );

  return (
    <span className="rotating-text" ref={rootRef}>
      <span className="rotating-text__sizer" aria-hidden="true">
        {words[0]}
      </span>
      {words.map((word) => (
        <span key={word} className="rotating-text__word">
          {word}
        </span>
      ))}
    </span>
  );
}

const FOOTER_WORD = "axio";

export default function HomePage({ onNavigate, playIntro = false }) {
  const homeRef = useRef(null);
  const footerRef = useRef(null);
  const marqueeRef = useRef(null);
  const [showIntro] = useState(playIntro);

  useGSAP(
    () => {
      const root = footerRef.current;
      if (!root) return;

      const glyphs = gsap.utils.toArray(".home-footer__glyph", root);
      const word = root.querySelector(".home-footer__word");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!glyphs.length || !word) return;

      const fitWord = () => {
        word.style.fontSize = "100px";
        const width = glyphs.reduce((sum, glyph) => sum + glyph.getBoundingClientRect().width, 0);
        if (!width) return;
        word.style.fontSize = `${(word.clientWidth / width) * 100}px`;
      };

      const reveal = root.querySelector(".home-footer__reveal");

      let alive = true;
      let played = false;
      fitWord();

      const travel = (el) => el.parentElement?.offsetHeight || el.offsetHeight;

      const hide = () => {
        gsap.set(glyphs, {
          y: (index, el) => travel(el),
          yPercent: 0,
          overwrite: "auto",
        });
      };

      const rise = () => {
        played = true;
        gsap.fromTo(
          glyphs,
          { y: (index, el) => travel(el), yPercent: 0 },
          {
            y: 0,
            duration: 1.05,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: "auto",
          }
        );
      };

      const onResize = () => {
        fitWord();
        ScrollTrigger.refresh();
        if (!played) hide();
      };
      window.addEventListener("resize", onResize);

      if (reduced) {
        gsap.set(glyphs, { y: 0, yPercent: 0, overwrite: "auto" });
        return () => {
          alive = false;
          window.removeEventListener("resize", onResize);
        };
      }

      hide();

      if (reveal) {
        gsap.fromTo(
          reveal,
          { y: -160, force3D: false },
          {
            y: 0,
            force3D: false,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "top 28%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      ScrollTrigger.create({
        trigger: word,
        start: "top 88%",
        onEnter: rise,
        onLeaveBack: () => {
          played = false;
          hide();
        },
      });

      document.fonts?.ready.then(() => {
        if (!alive) return;
        fitWord();
        ScrollTrigger.refresh();
        if (!played) hide();
      });

      return () => {
        alive = false;
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: footerRef }
  );

  useGSAP(
    () => {
      const root = marqueeRef.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const track = root.querySelector(".home-marquee__track");
      const group = root.querySelector(".home-marquee__group");
      if (!track || !group) return;
      const play = () => {
        const distance = group.offsetWidth;
        if (!distance) return;
        gsap.killTweensOf(track);
        gsap.set(track, { x: 0 });
        gsap.to(track, {
          x: -distance,
          duration: Math.max(16, distance / 110),
          ease: "none",
          repeat: -1,
        });
      };
      play();
      window.addEventListener("resize", play);
      return () => {
        window.removeEventListener("resize", play);
      };
    },
    { scope: marqueeRef }
  );

  useGSAP(
    (context, contextSafe) => {
      const button = homeRef.current?.querySelector(".home-banner__button");
      const wipe = button?.querySelector(".home-banner__button-wipe");
      if (!button || !wipe) return;

      gsap.set(wipe, { scaleX: 0, transformOrigin: "0% 50%" });

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tweenTo = (scaleX) => {
        gsap.to(wipe, {
          scaleX,
          duration: reduced ? 0 : 0.7,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      };
      const onEnter = contextSafe(() => tweenTo(1));
      const onLeave = contextSafe(() => tweenTo(0));

      button.addEventListener("pointerenter", onEnter);
      button.addEventListener("pointerleave", onLeave);

      return () => {
        button.removeEventListener("pointerenter", onEnter);
        button.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: homeRef }
  );

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nav = homeRef.current?.querySelector(".site-nav");
      const label = gsap.utils.toArray('[data-reveal="eyebrow"] .reveal-inner');
      const headingLines = gsap.utils.toArray('[data-reveal="heading"] .reveal-inner');
      const supportLines = gsap.utils.toArray('[data-reveal="description"] .reveal-inner');
      const ctaButton = gsap.utils.toArray('[data-reveal="cta"] .reveal-inner');

      const intro = homeRef.current?.querySelector(".home-intro");
      const introPanel = intro?.querySelector(".home-intro__panel");
      const introLetters = gsap.utils.toArray(".home-intro__letter", intro);

      if (reduced) {
        gsap.set([nav, ...label, ...headingLines, ...supportLines, ...ctaButton].filter(Boolean), {
          yPercent: 0,
        });
        if (intro) gsap.set(intro, { autoAlpha: 0, pointerEvents: "none" });
        homeRef.current?.classList.remove("is-intro");
        return;
      }

      if (!showIntro && intro) {
        gsap.set(intro, { autoAlpha: 0, pointerEvents: "none" });
        homeRef.current?.classList.remove("is-intro");
      }

      const tl = gsap.timeline({
        defaults: { ease: REVEAL_EASE, overwrite: "auto" },
      });

      if (showIntro && intro && introPanel && introLetters.length) {
        const pageBits = Array.from(homeRef.current.children).filter(
          (el) => el !== intro
        );
        document.body.classList.add("is-locked");
        homeRef.current.classList.add("is-intro");
        gsap.set(intro, { autoAlpha: 1, pointerEvents: "auto" });
        gsap.set(introLetters, { yPercent: 100 });
        gsap.set(introPanel, { scaleY: 0, transformOrigin: "50% 100%" });

        tl.to(introPanel, {
          scaleY: 1,
          duration: 0.38,
          ease: "back.out(1.12)",
        })
          .to(
            introLetters,
            {
              yPercent: 0,
              duration: 0.48,
              stagger: 0.04,
            },
            "-=0.12"
          )
          .to(
            introLetters,
            {
              yPercent: -110,
              duration: 0.28,
              stagger: 0.018,
              ease: "power3.in",
            },
            "+=0.1"
          )
          .set(introPanel, { transformOrigin: "50% 0%" })
          .add(() => {
            homeRef.current?.classList.remove("is-intro");
            gsap.set(pageBits, { autoAlpha: 1 });
            ScrollTrigger.refresh();
          })
          .to(
            introPanel,
            {
              scaleY: 0,
              duration: 0.38,
              ease: "power3.inOut",
            },
            "<0.02"
          )
          .set(intro, { autoAlpha: 0, pointerEvents: "none" })
          .add(() => document.body.classList.remove("is-locked"));
      }

      if (label.length) {
        tl.from(
          label,
          {
            yPercent: -100,
            duration: 0.75,
          },
          0
        );
      }

      if (headingLines.length) {
        tl.from(
          headingLines,
          {
            yPercent: 100,
            duration: 0.8,
            stagger: 0.1,
          },
          "-=0.48"
        );
      }

      if (supportLines.length) {
        tl.from(
          supportLines,
          {
            yPercent: 100,
            duration: 0.75,
            stagger: 0.1,
          },
          "-=0.52"
        );
      }

      if (ctaButton.length) {
        tl.from(
          ctaButton,
          {
            yPercent: 100,
            duration: 0.7,
          },
          "-=0.42"
        );
      }

      const ticker = homeRef.current?.querySelector(".home-ticker");
      const tickerTrack = ticker?.querySelector(".home-ticker__track");
      const tickerGroup = tickerTrack?.querySelector(".home-ticker__group");
      if (ticker && tickerTrack && tickerGroup) {
        gsap.to(tickerTrack, {
          x: () => -tickerGroup.scrollWidth * 0.38,
          ease: TICKER_SCROLL_EASE,
          scrollTrigger: {
            trigger: ticker,
            start: "top bottom",
            end: "bottom+=240% top",
            scrub: 0.28,
            invalidateOnRefresh: true,
          },
        });
      }

      const cinemaStage = homeRef.current?.querySelector(".home-cinema__pin");
      const cinemaMedia = homeRef.current?.querySelector(".home-cinema__media");
      if (cinemaStage && cinemaMedia) {
        const cinemaTl = gsap.timeline({
          defaults: { ease: CINEMA_EASE },
          scrollTrigger: {
            trigger: cinemaMedia,
            start: "top 92%",
            end: "top 8%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        cinemaTl.fromTo(
          cinemaMedia,
          {
            width: () => Math.min(720, window.innerWidth - 64),
          },
          {
            width: () => {
              const cards = homeRef.current?.querySelector(".home-expand__inner");
              return cards?.getBoundingClientRect().width || Math.min(1400, window.innerWidth - 80);
            },
            duration: 1,
          }
        );
      }

      gsap.utils.toArray("[data-scroll-reveal]", homeRef.current).forEach((group) => {
        const lines = gsap.utils.toArray(".scroll-reveal__inner", group);
        if (!lines.length) return;

        gsap.from(lines, {
          yPercent: 100,
          duration: 0.8,
          stagger: 0.1,
          ease: REVEAL_EASE,
          scrollTrigger: {
            trigger: group,
            start: "top 88%",
            once: true,
          },
        });
      });

      return () => {
        document.body.classList.remove("is-locked");
        homeRef.current?.classList.remove("is-intro");
      };
    },
    { scope: homeRef }
  );


  return (
    <div className="home page-view" ref={homeRef}>
      <div className="home-intro" aria-hidden="true">
        <div className="home-intro__panel">
          <p className="home-intro__word">
            {["u", "i", "v", "o", "l", "v", "e"].map((letter, index) => (
              <span className="home-intro__mask" key={`${letter}-${index}`}>
                <span className="home-intro__letter">{letter}</span>
              </span>
            ))}
          </p>
        </div>
      </div>

      <DynamicNav onNavigate={onNavigate} />

      <div className="home-sheet">
      <section className="home-banner" id="top">
        <div className="home-banner__brand">
          <img
            className="home-banner__branding"
            src={axioBrandingBg}
            alt=""
            aria-hidden="true"
            draggable="false"
          />
        </div>
        <div className="home-banner__layout">
          <div className="home-banner__inner">
            <div className="home-banner__badge-mask" data-reveal="eyebrow">
              <p className="home-banner__badge reveal-inner">
                <span className="home-banner__laurel" aria-hidden="true">
                  ❦
                </span>
                <span className="home-banner__badge-text">Webflow Awards Finalist</span>
                <span className="home-banner__laurel" aria-hidden="true">
                  ❦
                </span>
              </p>
            </div>

            <div className="home-banner__typo">
              <h1 className="home-banner__title" data-reveal="heading">
                <span className="home-banner__line home-banner__line--1">
                  <span className="reveal-inner">
                    One <RotatingWord />.
                  </span>
                </span>
                <span className="home-banner__line home-banner__line--2">
                  <span className="reveal-inner">Built for every layer.</span>
                </span>
              </h1>

              <div className="home-banner__end">
                <div className="home-banner__cta" data-reveal="cta">
                  <span className="reveal-inner">
                    <button
                      className="home-banner__button"
                      type="button"
                      onClick={() => onNavigate("library")}
                    >
                      <span className="home-banner__button-fill" aria-hidden="true">
                        <span className="home-banner__button-wipe" />
                      </span>
                      <span className="home-banner__button-label">Explore the Library</span>
                      <span className="home-banner__button-tile" aria-hidden="true">
                        <span className="home-banner__button-clip">
                          <span className="home-banner__button-scene">
                            <span className="home-banner__button-rig">
                              <span className="home-banner__button-face home-banner__button-face--front">
                                <svg viewBox="0 0 24 24">
                                  <path d="M9 6.5 15 12l-6 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                              <span className="home-banner__button-face home-banner__button-face--next">
                                <svg viewBox="0 0 24 24">
                                  <path d="M9 6.5 15 12l-6 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <FloatTiles />
        </div>
      </section>

      <section className="home-expand">
        <div className="home-expand__inner">
          <div className="home-expand__copy">
            <h2 className="home-expand__title" data-scroll-reveal>
              <span className="scroll-reveal">
                <span className="scroll-reveal__inner">One platform.</span>
              </span>
              <span className="scroll-reveal">
                <span className="scroll-reveal__inner">every layer of the build.</span>
              </span>
            </h2>
          </div>

          <ExpandCards />
        </div>
      </section>

      <FeatureCards onOpen={() => onNavigate("library")} />

      <FaqAccordion />

      <div className="home-marquee" ref={marqueeRef} aria-hidden="true">
        <div className="home-marquee__track">
          {[0, 1].map((group) => (
            <div className="home-marquee__group" key={group}>
              {Array.from({ length: 6 }, (_, index) => (
                <span className="home-marquee__item" key={`${group}-${index}`}>
                  Every layer
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>

      <footer className="home-footer" ref={footerRef}>
        <div className="home-footer__reveal">
        <div className="home-footer__inner">
          <div className="home-footer__grid">
            <div className="home-footer__intro">
              <button className="home-footer__brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <span className="home-footer__mark" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M8 1.2 14.2 8 8 14.8 1.8 8 8 1.2z" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
                axio
              </button>
              <h2 className="home-footer__title">
                Preview it live.
                <br />
                Then make it yours.
              </h2>
              <p className="home-footer__lede">
                Open the motion, the components, and the systems, then take the pieces that fit what you&apos;re building.
              </p>
              <button className="home-footer__cta" type="button" onClick={() => onNavigate("library")}>
                Explore the library
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p className="home-footer__note">
                Want a narrower start?
                <br />
                <button type="button" onClick={() => onNavigate("library", { category: "Animation" })}>
                  Browse the motion pieces.
                </button>
              </p>
            </div>
            <div className="home-footer__cols">
              <div className="home-footer__col">
                <h3>Browse</h3>
                <ul>
                  <li><button type="button" onClick={() => onNavigate("library")}>The library</button></li>
                  <li><button type="button" onClick={() => onNavigate("library", { category: "Animation" })}>Motion</button></li>
                  <li><button type="button" onClick={() => onNavigate("library", { category: "Gallery" })}>Gallery</button></li>
                  <li><button type="button" onClick={() => onNavigate("library", { category: "Cards" })}>Cards</button></li>
                </ul>
              </div>
              <div className="home-footer__col">
                <h3>Follow</h3>
                <ul>
                  <li>
                    <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                      LinkedIn
                      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 8.8 8.8 3.2M4.6 3.2h4.2V7.4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
                      Instagram
                      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 8.8 8.8 3.2M4.6 3.2h4.2V7.4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </a>
                  </li>
                  <li>
                    <a href="https://x.com" target="_blank" rel="noreferrer">
                      X
                      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 8.8 8.8 3.2M4.6 3.2h4.2V7.4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="home-footer__col home-footer__col--plain">
                <ul>
                  <li><button type="button" onClick={() => onNavigate("library", { tier: "free" })}>Free pieces</button></li>
                  <li><button type="button" onClick={() => onNavigate("library", { tier: "pro" })}>Pro pieces</button></li>
                  <li><button type="button" onClick={() => onNavigate("library")}>Components</button></li>
                  <li><button type="button" onClick={() => onNavigate("library", { category: "Navigation" })}>Navigation</button></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="home-footer__base">
            <span>© {new Date().getFullYear()} axio</span>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Back to the top
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="home-footer__word" aria-label={FOOTER_WORD}>
          {FOOTER_WORD.split("").map((letter, index) => (
            <span className="home-footer__char" aria-hidden="true" key={`${letter}-${index}`}>
              <span className="home-footer__glyph">{letter}</span>
            </span>
          ))}
        </div>
        </div>
      </footer>
    </div>
  );
}
