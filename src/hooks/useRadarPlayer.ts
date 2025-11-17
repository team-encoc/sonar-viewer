import { useState, useEffect, useRef, useCallback } from 'react';
import { ParsedPacket } from '../utils/csvParser';

interface UseRadarPlayerReturn {
  isPlaying: boolean;
  currentIndex: number;
  currentPacket: ParsedPacket | null;
  progress: number;
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (index: number) => void;
}

export function useRadarPlayer(packets: ParsedPacket[]): UseRadarPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const currentPacket = packets.length > 0 ? packets[currentIndex] : null;
  const progress = packets.length > 0 ? (currentIndex / (packets.length - 1)) * 100 : 0;

  const play = useCallback(() => {
    if (packets.length === 0) return;
    setIsPlaying(true);
  }, [packets.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  const seek = useCallback((index: number) => {
    if (index >= 0 && index < packets.length) {
      setCurrentIndex(index);
    }
  }, [packets.length]);

  // Playback interval (14Hz = 71.4ms)
  useEffect(() => {
    if (isPlaying && packets.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= packets.length) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }, 71.4); // 14Hz packet rate
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, packets.length]);

  // Reset when packets change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [packets]);

  return {
    isPlaying,
    currentIndex,
    currentPacket,
    progress,
    play,
    pause,
    reset,
    seek
  };
}
