import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./ExploreNav.css";

gsap.registerPlugin(useGSAP);

export default function ExploreNav({ onNavigate }) {
  const shellRef = useRef(null);

  useGSAP(
    () => {
      const shell = shellRef.current;
      if (!shell) return;

      const maxW = () => Math.min(920, window.innerWidth - 32);
      const minW = () => Math.min(maxW() - 72, window.innerWidth - 40);

      const widthTo = gsap.quickTo(shell, "width", {
        duration: 0.45,
        ease: "power3.out",
      });

      const onScroll = () => {
        const progress = gsap.utils.clamp(0, 1, window.scrollY / 280);
        widthTo(gsap.utils.interpolate(maxW(), minW(), progress));
      };

      gsap.set(shell, { width: maxW() });
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);

      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    },
    { scope: shellRef }
  );

  return (
    <div className="explore-nav" ref={shellRef}>
      <div className="explore-nav__pill">
        <div className="explore-nav__bar">
          <button
            className="explore-nav__logo"
            type="button"
            aria-label="Home"
            onClick={() => {
              onNavigate?.("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          <div className="explore-nav__actions">
            <button className="explore-nav__btn explore-nav__btn--login" type="button">
              Login
            </button>
            <button className="explore-nav__btn explore-nav__btn--join" type="button">
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
