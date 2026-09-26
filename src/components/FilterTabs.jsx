import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import "./FeatureCards.css";

gsap.registerPlugin(useGSAP, CustomEase);

CustomEase.create("tabPillEase", "M0,0 C0.7,0 0.3,1 1,1");
CustomEase.create("tabLeadEase", "0.65, 0, 0.35, 1");
CustomEase.create("tabSnapEase", "0.76, 0, 0.24, 1");
CustomEase.create("tabSquishEase", "0.65, 0, 0.35, 1");

const TAB_EASE = "tabPillEase";
const LEAD_EASE = "tabLeadEase";
const SNAP_EASE = "tabSnapEase";
const SQUISH_EASE = "tabSquishEase";
const REST_TOP = 5;
const HOVER_BG = "#e8e8ea";
const PRESS_BG = "#d4d4d8";
const HOVER_EASE_LEAD = "cubic-bezier(0.22, 1, 0.36, 1)";
const HOVER_EASE_SNAP = "cubic-bezier(0.34, 1.25, 0.64, 1)";

export default function FilterTabs({
  items,
  value,
  onChange,
  label,
  variant = "blob",
  tone = "dark",
}) {
  const tabsRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const apiRef = useRef({
    moveTo: () => {},
    setActiveClass: () => {},
    itemById: () => null,
  });
  valueRef.current = value;
  onChangeRef.current = onChange;

  const light = variant === "classic" || tone === "light";
  const activeColor = light ? "#111111" : "#ffffff";
  const inactiveColor = "#8a8a8a";
  const hoverColor = "#444444";
  const itemKey = items.map((item) => item.id).join("|");

  useGSAP(
    (_context, contextSafe) => {
      const root = tabsRef.current;
      if (!root) return;

      const tabItems = gsap.utils.toArray(".feature-filter__item", root);
      const backdrop = root.querySelector(".feature-filter__backdrop");
      const hoverEl = root.querySelector(".feature-filter__hover");
      if (!tabItems.length || !backdrop) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const bgPos = { left: 0, right: 0 };
      const hoverPos = { left: 0, right: 0 };
      const size = { height: 0, top: REST_TOP };
      let moveTl;
      let hoveredItem = null;
      let hoverHeight = 0;
      let hideHoverTimer = null;
      let activating = false;

      const renderBackdrop = () => {
        const left = bgPos.left;
        const width = Math.max(0, bgPos.right - bgPos.left);
        gsap.set(backdrop, {
          left,
          width,
          height: size.height,
          top: size.top,
          force3D: false,
        });
      };

      const renderHover = () => {
        if (!hoverEl) return;
        gsap.set(hoverEl, {
          left: hoverPos.left,
          width: Math.max(0, hoverPos.right - hoverPos.left),
          height: hoverHeight,
          top: REST_TOP,
        });
      };

      const hideHover = (duration = 0.22, delay = 0) => {
        if (!hoverEl) return;
        gsap.to(hoverEl, {
          autoAlpha: 0,
          backgroundColor: HOVER_BG,
          duration: reduced ? 0 : duration,
          delay: reduced ? 0 : delay,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const moveHoverTo = (item, { pressed = false } = {}) => {
        if (!hoverEl || variant !== "blob") return;
        if (hideHoverTimer) {
          clearTimeout(hideHoverTimer);
          hideHoverTimer = null;
        }

        const targetLeft = item.offsetLeft;
        const targetRight = targetLeft + item.offsetWidth;
        hoverHeight = item.offsetHeight;
        const visible = Number(gsap.getProperty(hoverEl, "opacity")) > 0.05;

        gsap.to(hoverEl, {
          autoAlpha: 1,
          backgroundColor: pressed ? PRESS_BG : HOVER_BG,
          duration: reduced ? 0 : 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });

        if (reduced || !visible) {
          hoverPos.left = targetLeft;
          hoverPos.right = targetRight;
          renderHover();
          return;
        }

        const isMovingRight = targetLeft > hoverPos.left;
        gsap.killTweensOf(hoverPos);

        if (isMovingRight) {
          gsap.to(hoverPos, {
            right: targetRight,
            duration: 0.26,
            ease: HOVER_EASE_LEAD,
            onUpdate: renderHover,
            overwrite: "auto",
          });
          gsap.to(hoverPos, {
            left: targetLeft,
            duration: 0.38,
            ease: HOVER_EASE_SNAP,
            onUpdate: renderHover,
            overwrite: "auto",
          });
          return;
        }

        gsap.to(hoverPos, {
          left: targetLeft,
          duration: 0.26,
          ease: HOVER_EASE_LEAD,
          onUpdate: renderHover,
          overwrite: "auto",
        });
        gsap.to(hoverPos, {
          right: targetRight,
          duration: 0.38,
          ease: HOVER_EASE_SNAP,
          onUpdate: renderHover,
          overwrite: "auto",
        });
      };

      const itemById = (id) =>
        tabItems.find((el) => el.dataset.id === id) || tabItems[0];

      const paintTitlesFromCoverage = () => {
        tabItems.forEach((item) => {
          const title = item.querySelector(".feature-filter__title");
          if (!title) return;

          const itemLeft = item.offsetLeft;
          const itemRight = itemLeft + item.offsetWidth;
          const overlap = Math.max(
            0,
            Math.min(bgPos.right, itemRight) - Math.max(bgPos.left, itemLeft)
          );
          const coverage = gsap.utils.clamp(0, 1, overlap / item.offsetWidth);
          const blend = coverage * coverage * (3 - 2 * coverage);
          const restingColor =
            item === hoveredItem && !item.classList.contains("is-active")
              ? hoverColor
              : inactiveColor;

          gsap.set(title, {
            color: gsap.utils.interpolate(restingColor, activeColor, blend),
          });
        });
      };

      const sync = (item) => {
        bgPos.left = item.offsetLeft;
        bgPos.right = item.offsetLeft + item.offsetWidth;
        size.height = item.offsetHeight;
        size.top = REST_TOP;
        renderBackdrop();
        gsap.set(backdrop, { scaleY: 1, transformOrigin: "50% 50%" });
      };

      const moveToBlob = (targetItem) => {
        const targetLeft = targetItem.offsetLeft;
        const targetRight = targetLeft + targetItem.offsetWidth;
        const startLeft = bgPos.left;
        const startRight = bgPos.right;

        if (Math.abs(targetLeft - startLeft) < 1 && Math.abs(targetRight - startRight) < 1) {
          activating = false;
          sync(targetItem);
          return;
        }

        const restH = targetItem.offsetHeight || size.height;
        const isMovingRight = targetLeft > startLeft;

        moveTl?.kill();
        gsap.killTweensOf(bgPos);
        gsap.killTweensOf(size);
        size.height = restH;
        size.top = REST_TOP;

        moveTl = gsap.timeline({
          defaults: { overwrite: "auto" },
          onUpdate: () => {
            renderBackdrop();
            paintTitlesFromCoverage();
          },
          onComplete: () => {
            activating = false;
            sync(targetItem);
            paintTitlesFromCoverage();
          },
        });

        moveTl.to(
          backdrop,
          {
            scaleY: 0.88,
            transformOrigin: "50% 50%",
            duration: 0.22,
            ease: SQUISH_EASE,
          },
          0
        );
        moveTl.to(
          backdrop,
          {
            scaleY: 1,
            duration: 0.38,
            ease: SQUISH_EASE,
          },
          0.18
        );

        if (isMovingRight) {
          moveTl.to(
            bgPos,
            {
              right: targetRight,
              duration: 0.46,
              ease: LEAD_EASE,
            },
            0
          );
          moveTl.to(
            bgPos,
            {
              left: targetLeft,
              duration: 0.58,
              ease: SNAP_EASE,
            },
            0.06
          );
        } else {
          moveTl.to(
            bgPos,
            {
              left: targetLeft,
              duration: 0.46,
              ease: LEAD_EASE,
            },
            0
          );
          moveTl.to(
            bgPos,
            {
              right: targetRight,
              duration: 0.58,
              ease: SNAP_EASE,
            },
            0.06
          );
        }
      };

      const moveToClassic = (targetItem) => {
        const targetLeft = targetItem.offsetLeft;
        const targetRight = targetLeft + targetItem.offsetWidth;
        const isMovingRight = targetLeft > bgPos.left;

        moveTl?.kill();
        gsap.killTweensOf(bgPos);
        size.height = targetItem.offsetHeight;
        size.top = REST_TOP;

        if (isMovingRight) {
          gsap.to(bgPos, {
            right: targetRight,
            duration: 0.42,
            ease: TAB_EASE,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
          gsap.to(bgPos, {
            left: targetLeft,
            duration: 0.55,
            ease: TAB_EASE,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
        } else {
          gsap.to(bgPos, {
            left: targetLeft,
            duration: 0.42,
            ease: TAB_EASE,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
          gsap.to(bgPos, {
            right: targetRight,
            duration: 0.55,
            ease: TAB_EASE,
            onUpdate: renderBackdrop,
            overwrite: "auto",
          });
        }
      };

      const moveTo = (targetItem) => {
        if (reduced) {
          sync(targetItem);
          return;
        }
        if (variant === "classic") {
          moveToClassic(targetItem);
          return;
        }
        moveToBlob(targetItem);
      };

      const paintTitles = (target) => {
        tabItems.forEach((el) => {
          const title = el.querySelector(".feature-filter__title");
          if (!title) return;
          gsap.to(title, {
            color: el === target ? activeColor : inactiveColor,
            duration: reduced ? 0 : variant === "blob" ? 0.42 : 0.38,
            ease: TAB_EASE,
            overwrite: "auto",
          });
        });
      };

      const setActiveClass = (target) => {
        tabItems.forEach((el) => el.classList.toggle("is-active", el === target));
        if (hoveredItem === target) hoveredItem = null;
        if (variant === "blob" && !reduced) return;
        paintTitles(target);
      };

      const initial = itemById(valueRef.current);
      sync(initial);
      tabItems.forEach((el) => {
        el.classList.toggle("is-active", el === initial);
        const title = el.querySelector(".feature-filter__title");
        if (title) {
          gsap.set(title, { color: el === initial ? activeColor : inactiveColor });
        }
      });

      apiRef.current = { moveTo, setActiveClass, itemById };

      const cleanups = tabItems.map((item) => {
        const title = item.querySelector(".feature-filter__title");
        const onPress = () => {
          backdrop.classList.add("is-pressed");
          if (variant !== "blob" || item.classList.contains("is-active")) return;
          moveHoverTo(item, { pressed: true });
        };
        const onRelease = () => backdrop.classList.remove("is-pressed");
        const onHoverIn = contextSafe(() => {
          if (variant !== "blob") return;
          if (item.classList.contains("is-active")) {
            hideHover();
            return;
          }

          hoveredItem = item;
          moveHoverTo(item);
          gsap.to(title, {
            color: hoverColor,
            duration: reduced ? 0 : 0.24,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
        const onHoverOut = contextSafe(() => {
          if (hoveredItem === item) hoveredItem = null;

          if (variant === "blob" && !item.classList.contains("is-active")) {
            gsap.to(title, {
              color: inactiveColor,
              duration: reduced ? 0 : 0.28,
              ease: "power2.out",
              overwrite: "auto",
            });
          }

          if (variant === "blob" && !activating) {
            hideHoverTimer = window.setTimeout(() => hideHover(), 40);
          }
        });

        const onClick = () => {
          const allowed = onChangeRef.current?.(item.dataset.id);
          if (allowed === false) return;
          if (variant === "blob" && !item.classList.contains("is-active")) {
            activating = true;
            moveHoverTo(item, { pressed: true });
            hideHover(0.28, 0.08);
          }
          setActiveClass(item);
          moveTo(item);
          if (reduced || variant !== "blob") activating = false;
        };

        item.addEventListener("click", onClick);
        item.addEventListener("pointerdown", onPress);
        item.addEventListener("pointerup", onRelease);
        item.addEventListener("pointerenter", onHoverIn);
        item.addEventListener("pointerleave", onRelease);
        item.addEventListener("pointerleave", onHoverOut);
        item.addEventListener("pointercancel", onRelease);

        return () => {
          item.removeEventListener("click", onClick);
          item.removeEventListener("pointerdown", onPress);
          item.removeEventListener("pointerup", onRelease);
          item.removeEventListener("pointerenter", onHoverIn);
          item.removeEventListener("pointerleave", onRelease);
          item.removeEventListener("pointerleave", onHoverOut);
          item.removeEventListener("pointercancel", onRelease);
        };
      });

      const onResize = () => sync(itemById(valueRef.current));
      window.addEventListener("resize", onResize);

      return () => {
        if (hideHoverTimer) clearTimeout(hideHoverTimer);
        moveTl?.kill();
        gsap.killTweensOf(bgPos);
        gsap.killTweensOf(size);
        gsap.killTweensOf(hoverPos);
        if (hoverEl) gsap.killTweensOf(hoverEl);
        cleanups.forEach((fn) => fn());
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: tabsRef, dependencies: [itemKey, variant, activeColor, tone] }
  );

  useLayoutEffect(() => {
    const target = apiRef.current.itemById(value);
    if (!target || target.classList.contains("is-active")) return;
    apiRef.current.setActiveClass(target);
    apiRef.current.moveTo(target);
  }, [value]);

  return (
    <div
      className={`feature-filter feature-filter--${variant}${tone === "light" ? " feature-filter--light" : ""}`}
      ref={tabsRef}
    >
      <div className="feature-filter__hover" aria-hidden="true" />
      <div className="feature-filter__backdrop" aria-hidden="true" />
      <ul className="feature-filter__list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`feature-filter__item${value === item.id ? " is-active" : ""}`}
            data-id={item.id}
            role="tab"
            tabIndex={0}
            aria-selected={value === item.id}
          >
            <div className="feature-filter__content">
              <span className="feature-filter__number">
                ({String(index + 1).padStart(2, "0")})
              </span>
              <h3 className="feature-filter__title">{item.label}</h3>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
