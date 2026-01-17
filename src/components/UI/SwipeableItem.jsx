import { useRef, useState } from 'react';

// =====================================================
// SWIPEABLE ITEM COMPONENT - Swipe left to delete
// =====================================================
export const SwipeableItem = ({ children, onDelete, deleteLabel = 'Eliminar' }) => {
  const itemRef = useRef(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const DELETE_THRESHOLD = -80;

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = translateX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startXRef.current;
    const newX = Math.min(0, Math.max(-120, currentXRef.current + diff));
    setTranslateX(newX);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (translateX < DELETE_THRESHOLD) {
      setTranslateX(-120);
    } else {
      setTranslateX(0);
    }
  };

  const handleDelete = () => {
    setTranslateX(-300);
    setTimeout(() => onDelete(), 200);
  };

  const resetSwipe = () => setTranslateX(0);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center bg-red-600 transition-all rounded-r-2xl"
        style={{ width: Math.abs(translateX) + 'px' }}
      >
        <button
          onClick={handleDelete}
          className="w-full h-full flex items-center justify-center text-white font-bold px-4"
        >
          {Math.abs(translateX) > 60 && <span className="flex items-center gap-2">🗑️ <span className="text-sm">{deleteLabel}</span></span>}
        </button>
      </div>

      {/* Main content */}
      <div
        ref={itemRef}
        className={`swipe-item relative bg-white ${isSwiping ? 'swiping' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={translateX < 0 ? resetSwipe : undefined}
      >
        {children}
      </div>
    </div>
  );
};
