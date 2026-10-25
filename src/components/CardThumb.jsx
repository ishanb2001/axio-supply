import gradient from "../assets/sunset.jpg";

export default function CardThumb() {
  return (
    <div className="card-thumb">
      <img
        className="card-thumb__shot"
        src={gradient}
        alt=""
        draggable={false}
        decoding="async"
        loading="lazy"
      />
    </div>
  );
}
