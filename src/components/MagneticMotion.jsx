import { useEffect } from "react";
import { startMagneticMotion } from "../motion/magnetic";
import "./MagneticMotion.css";

/** Enables fluid magnetic hover + press on site buttons. */
export default function MagneticMotion({ rootRef }) {
  useEffect(() => {
    const root = rootRef?.current || document;
    return startMagneticMotion(root);
  }, [rootRef]);

  return null;
}
