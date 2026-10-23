const NOTES = [
  {
    name: "Alex Xavier",
    quote:
      "Overall one of the BEST values I’ve come across from a Pro membership standpoint. Genuinely hard to justify not subscribing.",
  },
  {
    name: "Mina Cole",
    quote:
      "I stopped rebuilding the same motion from scratch. The pieces preview live, and the ones I keep actually fit the product.",
  },
  {
    name: "Jonah Ellis",
    quote:
      "The glass, the type, the scroll work — it all sits in one place. I can see it moving before I take any of it.",
  },
];

export default function BlackSections() {
  return (
    <div className="home-black-notes">
      <section className="home-about" aria-label="Behind the project">
        <p className="home-about__label">
          <span className="home-about__mark" aria-hidden="true" />
          Behind the project
        </p>
        <p className="home-about__copy">
          Uivolve is Ishan’s library of interface work. Glass, navigation, cards, and scroll run live here, so you can watch a piece move before you keep the code.
        </p>
      </section>

      <section className="home-dark-faq" aria-label="Testimonials">
        <p className="home-dark-faq__kicker">
          <span className="home-about__mark" aria-hidden="true" />
          In their words
        </p>
        <h2 className="home-dark-faq__title">A few notes.</h2>
        <div className="home-dark-faq__row">
          {NOTES.map((item) => (
            <article className="home-dark-faq__card" key={item.name}>
              <span className="home-dark-faq__edge-clip" aria-hidden="true">
                <span className="home-dark-faq__edge" />
              </span>
              <header className="home-dark-faq__person">
                <span className="home-dark-faq__avatar" aria-hidden="true" />
                <h3>{item.name}</h3>
              </header>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
