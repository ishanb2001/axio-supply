import { projects, projectStatus } from "../data/projects";
import CardThumb from "./CardThumb";
import "./FeatureCards.css";

const PREVIEW = projects.slice(0, 6);

export default function FeatureCards({ onOpen }) {
  return (
    <section className="feature-cards">
      <div className="feature-cards__intro" data-scroll-reveal>
        <h2 className="feature-cards__title">
          <span className="scroll-reveal">
            <span className="scroll-reveal__inner">A few pieces of our library.</span>
          </span>
        </h2>
      </div>

      <div className="feature-cards__stack">
        <div className="feature-cards__grid">
          {PREVIEW.map((project, index) => {
            const status = projectStatus(project);
            const isNew = index < 5;

            return (
              <button
                key={project.id}
                className="feature-card"
                type="button"
                data-project-id={project.id}
                onClick={() => onOpen?.()}
              >
                <div className="feature-card__stage">
                  {isNew ? (
                    <p className="feature-card__badge">
                      <span />
                      New
                    </p>
                  ) : null}
                  <CardThumb project={project} />
                </div>
                <div className="feature-card__meta">
                  <h3>{project.title}</h3>
                  <p>
                    <span className="feature-card__free-icon" aria-hidden="true" />
                    {status}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="feature-cards__fade" aria-hidden="true" />

        <div className="feature-cards__more">
          <button
            className="feature-cards__view-all"
            type="button"
            onClick={() => onOpen?.()}
          >
            View all
          </button>
        </div>
      </div>
    </section>
  );
}
