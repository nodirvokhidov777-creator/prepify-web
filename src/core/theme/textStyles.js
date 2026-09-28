import { colors } from './colors';
const base = (size, weight, color = colors.text, extra = {}) => ({
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontSize: size, fontWeight: weight, color, ...extra,
});
export const textStyles = {
  bandDisplay: (color = colors.text) => base(44, 800, color, { lineHeight: 1.0 }),
  bandDisplayMedium: (color = colors.text) => base(30, 800, color, { lineHeight: 1.0 }),
  screenTitle: (color = colors.text) => base(22, 800, color),
  heading: (color = colors.text) => base(18, 700, color),
  cardTitle: (color = colors.text) => base(15, 700, color),
  body: (color = colors.text) => base(14, 500, color, { lineHeight: 1.35 }),
  bodyDim: (color = colors.textDim) => base(13.5, 500, color, { lineHeight: 1.4 }),
  label: (color = colors.textDim) => base(11, 700, color, { letterSpacing: 0.4 }),
  meta: (color = colors.textFaint) => base(11, 600, color),
  buttonLabel: (color = colors.white) => base(14.5, 700, color),
};
