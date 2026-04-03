import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import gsap from 'gsap';

/* ── Card ────────────────────────────────────────────────────── */
export const Card = forwardRef(({ style, className = '', children, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={className}
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      borderRadius: 20,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

/* ── Helpers ─────────────────────────────────────────────────── */
const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  });

/* ── CardSwap ────────────────────────────────────────────────── */
const CardSwap = forwardRef(({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  skewAmount = 6,
  onSwap,
  children,
}, outerRef) => {
  const EASE = 'elastic.out(0.6, 0.8)';
  const DUR_DROP = 0.5;
  const DUR_MOVE = 0.55;
  const DUR_RETURN = 0.6;

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const animating = useRef(false);
  const swapCount = useRef(0);
  const container = useRef(null);

  /* Place cards on mount */
  useEffect(() => {
    refs.forEach((r, i) =>
      placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, refs.length), skewAmount)
    );
  }, [cardDistance, verticalDistance, skewAmount, refs]);

  /* Core swap — one card cycle, returns a promise */
  const swapOnce = useCallback(() => {
    return new Promise((resolve) => {
      if (animating.current || order.current.length < 2) { resolve(); return; }
      animating.current = true;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      const total = refs.length;
      const tl = gsap.timeline({
        onComplete: () => {
          order.current = [...rest, front];
          swapCount.current += 1;
          animating.current = false;
          onSwap?.(swapCount.current);
          resolve();
        },
      });

      /* 1 — front card drops down & fades */
      tl.to(elFront, {
        y: '+=400',
        opacity: 0,
        duration: DUR_DROP * 0.4,
        ease: 'power2.in',
      });

      /* 2 — promote remaining cards (bouncy elastic) */
      tl.addLabel('promote', `-=${DUR_DROP * 0.12}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(el, {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: DUR_MOVE,
          ease: EASE,
        }, `promote+=${i * 0.08}`);
      });

      /* 3 — front card returns to back (bouncy elastic) */
      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      tl.addLabel('return', `promote+=${DUR_MOVE * 0.15}`);
      tl.call(() => { gsap.set(elFront, { zIndex: backSlot.zIndex }); }, undefined, 'return');
      tl.to(elFront, {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        opacity: 1,
        duration: DUR_RETURN,
        ease: EASE,
      }, 'return');
    });
  }, [refs, cardDistance, verticalDistance, onSwap]);

  /* Expose swapNext to parent via ref */
  useImperativeHandle(outerRef, () => ({
    swapNext: swapOnce,
    isAnimating: () => animating.current,
    getSwapCount: () => swapCount.current,
  }), [swapOnce]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
        })
      : child
  );

  return (
    <div
      ref={container}
      style={{
        position: 'relative',
        perspective: 900,
        width,
        height,
      }}
    >
      {rendered}
    </div>
  );
});
CardSwap.displayName = 'CardSwap';

export default CardSwap;
