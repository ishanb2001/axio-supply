import gradient from "../assets/Sunset-2048x1396.png";

export default function CardThumb() {
  return (
    <div className="card-thumb">
      <img className="card-thumb__shot" src={gradient} alt="" draggable={false} />
    </div>
  );
}
