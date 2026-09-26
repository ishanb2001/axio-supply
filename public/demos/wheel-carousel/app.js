const ITEMS = [
  {
    title: "Northlight",
    tag: "Editorial",
    image: "https://picsum.photos/seed/northlight/800/1000",
  },
  {
    title: "Glass studio",
    tag: "Interior",
    image: "https://picsum.photos/seed/glass-studio/800/1000",
  },
  {
    title: "Coast line",
    tag: "Travel",
    image: "https://picsum.photos/seed/coast-line/800/1000",
  },
  {
    title: "Quiet object",
    tag: "Product",
    image: "https://picsum.photos/seed/quiet-object/800/1000",
  },
  {
    title: "After hours",
    tag: "Portrait",
    image: "https://picsum.photos/seed/after-hours/800/1000",
  },
  {
    title: "Paper fold",
    tag: "Still life",
    image: "https://picsum.photos/seed/paper-fold/800/1000",
  },
  {
    title: "Blue hour",
    tag: "Landscape",
    image: "https://picsum.photos/seed/blue-hour/800/1000",
  },
];

const wheel = document.getElementById("wheel");
const track = document.getElementById("track");
const status = document.getElementById("status");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cards = ITEMS.map((item, index) => {
  const li = document.createElement("li");
  li.className = "card";
  li.innerHTML = `
    <img class="card__media" src="${item.image}" alt="" draggable="false" />
    <div class="card__body">
      <p class="card__tag">${item.tag}</p>
      <h2 class="card__title">${item.title}</h2>
    </div>
    <span class="card__glow" aria-hidden="true"></span>
  `;
  track.appendChild(li);
  return {
    el: li,
    glow: li.querySelector(".card__glow"),
    title: item.title,
    index,
  };
});

const state = { pos: 0 };
let velocity = 0;
let dragging = false;
let snapTween = null;
let activeIndex = 0;

function wrapDelta(index, position, length) {
  let delta = index - position;
  delta = ((delta % length) + length) % length;
  if (delta > length / 2) delta -= length;
  return delta;
}

function stepSize() {
  return Math.min(188, wheel.clientHeight * 0.3);
}

function layout(position) {
  const length = cards.length;
  const step = stepSize();
  let closest = 0;
  let closestAbs = Infinity;

  cards.forEach((card) => {
    const delta = wrapDelta(card.index, position, length);
    const abs = Math.abs(delta);
    const scale = gsap.utils.clamp(0.62, 1, 1 - abs * 0.15);
    const opacity = gsap.utils.clamp(0, 1, 1 - abs * 0.42);
    const y = delta * step;
    const z = -Math.min(abs, 2.4) * 110;
    const rotateX = delta * -16;
    const blur = abs > 1.25 ? Math.min(10, (abs - 1.25) * 7) : 0;
    const glow = abs > 1.05 ? gsap.utils.clamp(0, 1, (abs - 1.05) / 1.15) : 0;

    card.el.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotateX}deg) scale(${scale})`;
    card.el.style.opacity = String(opacity);
    card.el.style.filter = blur > 0.15 ? `blur(${blur}px)` : "none";
    card.el.style.zIndex = String(100 - Math.round(abs * 20));
    card.el.style.pointerEvents = abs < 0.45 ? "auto" : "none";
    card.glow.style.opacity = String(glow);

    if (abs < closestAbs) {
      closestAbs = abs;
      closest = card.index;
    }
  });

  if (closest !== activeIndex) {
    activeIndex = closest;
    const label = cards[activeIndex].title;
    const count = String(activeIndex + 1).padStart(2, "0");
    status.textContent = `${count}  ${label}`;
    wheel.setAttribute("aria-label", `${label}, ${count} of ${length}`);
  }
}

function killSnap() {
  if (!snapTween) return;
  snapTween.kill();
  snapTween = null;
}

function snapToNearest() {
  const target = Math.round(state.pos);
  if (reduced || Math.abs(target - state.pos) < 0.001) {
    state.pos = target;
    velocity = 0;
    layout(state.pos);
    return;
  }

  snapTween = gsap.to(state, {
    pos: target,
    duration: 0.55,
    ease: "power3.out",
    onUpdate: () => layout(state.pos),
    onComplete: () => {
      snapTween = null;
      velocity = 0;
      layout(state.pos);
    },
  });
}

function goBy(direction) {
  killSnap();
  velocity = 0;
  const target = Math.round(state.pos) + direction;
  if (reduced) {
    state.pos = target;
    layout(state.pos);
    return;
  }
  snapTween = gsap.to(state, {
    pos: target,
    duration: 0.62,
    ease: "power3.out",
    onUpdate: () => layout(state.pos),
    onComplete: () => {
      snapTween = null;
      layout(state.pos);
    },
  });
}

gsap.ticker.add(() => {
  if (dragging || snapTween || reduced) return;

  velocity *= 0.9;
  if (Math.abs(velocity) < 0.0016) {
    if (Math.abs(state.pos - Math.round(state.pos)) > 0.004) snapToNearest();
    else velocity = 0;
    return;
  }

  state.pos += velocity;
  velocity = gsap.utils.clamp(-0.42, 0.42, velocity);
  layout(state.pos);
});

wheel.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    killSnap();
    const delta = event.deltaY * 0.0024;
    state.pos += delta;
    velocity = gsap.utils.clamp(-0.42, 0.42, delta * 0.85);
    layout(state.pos);
  },
  { passive: false }
);

if (window.Observer) {
  Observer.create({
    target: wheel,
    type: "touch,pointer",
    dragMinimum: 4,
    onPress: () => {
      dragging = true;
      killSnap();
      velocity = 0;
    },
    onDrag: (self) => {
      state.pos -= self.deltaY / stepSize();
      layout(state.pos);
    },
    onRelease: (self) => {
      dragging = false;
      velocity = gsap.utils.clamp(-0.48, 0.48, -self.velocityY / 1400);
      if (Math.abs(velocity) < 0.02) snapToNearest();
    },
  });
}

wheel.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    goBy(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    goBy(-1);
  }
});

window.addEventListener("resize", () => layout(state.pos));
layout(0);
status.textContent = `01  ${cards[0].title}`;
