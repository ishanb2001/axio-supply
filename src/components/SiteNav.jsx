import "./SiteNav.css";

export default function SiteNav({ active = "home", onNavigate, theme = "light" }) {
  return (
    <header className={`library-nav library-nav--${theme}`}>
      <div className="library-nav__inner">
        <button
          className="library-nav__brand"
          type="button"
          onClick={() => onNavigate("home")}
        >
          Uivolve
        </button>

        <nav className="library-nav__links" aria-label="Primary">
          <button
            type="button"
            className={active === "home" ? "is-active" : undefined}
            onClick={() => onNavigate("home")}
          >
            Home
          </button>
          <button
            type="button"
            className={active === "library" ? "is-active" : undefined}
            onClick={() => onNavigate("library")}
          >
            Library
          </button>
          {active === "home" && (
            <>
              <a href="#process">Process</a>
              <a href="#faq">FAQ</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
