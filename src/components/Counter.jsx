import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

/* ── Single digit roller ─────────────────────────────────────── */
function NumberRoll({ mv, number, height }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) memo -= 10 * height;
    return memo;
  });
  return (
    <motion.span
      style={{
        y,
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {number}
    </motion.span>
  );
}

function normalizeNearInteger(num) {
  const nearest = Math.round(num);
  const tolerance = 1e-9 * Math.max(1, Math.abs(num));
  return Math.abs(num - nearest) < tolerance ? nearest : num;
}

function getValueRoundedToPlace(value, place) {
  const scaled = value / place;
  return Math.floor(normalizeNearInteger(scaled));
}

/* ── Single place digit ──────────────────────────────────────── */
function Digit({ place, value, height, digitStyle }) {
  const isDecimal = place === '.';
  const valueRoundedToPlace = isDecimal ? 0 : getValueRoundedToPlace(value, place);
  const animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    if (!isDecimal) animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace, isDecimal]);

  if (isDecimal) {
    return (
      <span
        style={{
          position: 'relative',
          width: 'fit-content',
          height,
          fontVariantNumeric: 'tabular-nums',
          ...digitStyle,
        }}
      >
        .
      </span>
    );
  }

  return (
    <span
      style={{
        position: 'relative',
        width: '1ch',
        height,
        fontVariantNumeric: 'tabular-nums',
        ...digitStyle,
      }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <NumberRoll key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </span>
  );
}

/* ── Counter component ───────────────────────────────────────── */
export default function Counter({
  value,
  fontSize = 100,
  padding = 0,
  places,
  gap = 8,
  borderRadius = 4,
  horizontalPadding = 8,
  textColor = 'inherit',
  fontWeight = 'inherit',
  containerStyle,
  counterStyle,
  digitStyle,
  gradientHeight = 16,
  gradientFrom = 'black',
  gradientTo = 'transparent',
  topGradientStyle,
  bottomGradientStyle,
}) {
  const height = fontSize + padding;

  const computedPlaces = places ?? [...value.toString()].map((ch, i, a) => {
    if (ch === '.') return '.';
    return 10 ** (
      a.indexOf('.') === -1
        ? a.length - i - 1
        : i < a.indexOf('.')
          ? a.indexOf('.') - i - 1
          : -(i - a.indexOf('.'))
    );
  });

  const defaultTopGrad = {
    height: gradientHeight,
    background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
  };
  const defaultBottomGrad = {
    height: gradientHeight,
    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block', ...containerStyle }}>
      <span
        style={{
          display: 'flex',
          overflow: 'hidden',
          lineHeight: 1,
          fontSize,
          gap,
          borderRadius,
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          color: textColor,
          fontWeight,
          ...counterStyle,
        }}
      >
        {computedPlaces.map((place) => (
          <Digit key={place} place={place} value={value} height={height} digitStyle={digitStyle} />
        ))}
      </span>
      <span style={{ pointerEvents: 'none', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        <span style={topGradientStyle ?? defaultTopGrad} />
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            ...(bottomGradientStyle ?? defaultBottomGrad),
          }}
        />
      </span>
    </span>
  );
}
