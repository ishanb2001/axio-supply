import { useState } from "react";
import { demoSrc } from "../data/projects";

export default function CardThumb({ project }) {
  const [hovered, setHovered] = useState(false);
  const thumb = `/thumbnails/${project.id}.jpg`;

  return (
    <div
      className={`card-thumb${hovered ? " is-live" : ""}`}
      style={{ background: project.background }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        className="card-thumb__shot"
        src={thumb}
        alt=""
        loading="lazy"
        draggable={false}
      />

      {hovered && (
        <div className="card-thumb__live" aria-hidden="true">
          <iframe
            src={demoSrc(project.file)}
            title={`${project.title} live preview`}
            tabIndex={-1}
            sandbox="allow-scripts allow-same-origin"
          />
          <div className="card-thumb__shield" />
        </div>
      )}
    </div>
  );
}
