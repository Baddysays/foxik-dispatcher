import { FOX_SWATCH, isUnknownFoxColor } from "../data.js";

/** Кружок окраса лисы. Для «неизвестен» — разноцветный градиент (только из JSON). */
export default function FoxColorDot({ color, className = "" }) {
  const unknown = isUnknownFoxColor(color);
  const swatch = FOX_SWATCH[color];
  return (
    <span
      className={"swatch-dot" + (unknown ? " fox-color-unknown" : "") + (className ? " " + className : "")}
      style={unknown || !swatch ? undefined : { background: swatch.body }}
      title={unknown ? "Окрас неизвестен (из JSON)" : color}
    />
  );
}
