import { useState } from 'react';

import type { Image } from '#/lib/types';

type VoteState = 'up' | 'down' | null;

interface ImageInteractionState {
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
  vote: VoteState;
  faved: boolean;
  hidden: boolean;
}

interface ImageInteraction extends ImageInteractionState {
  toggleUpvote: () => void;
  toggleDownvote: () => void;
  toggleFave: () => void;
  toggleHidden: () => void;
}

/**
 * Client-side, optimistic image interactions (fave / upvote / downvote / hide),
 * mirroring the behaviour of Philomena's thumbnail interaction bar. There is no
 * backend yet, so state is kept locally and never persisted — clicking simply
 * updates the on-screen counters the way the real API eventually will.
 */
export function useImageInteraction(image: Image): ImageInteraction {
  const [state, setState] = useState<ImageInteractionState>(() => ({
    score: image.score,
    upvotes: image.upvotes,
    downvotes: image.downvotes,
    faves: image.faves,
    vote: null,
    faved: false,
    hidden: false,
  }));

  const toggleUpvote = () => {
    setState(prev => {
      if (prev.vote === 'up') {
        return { ...prev, vote: null, upvotes: prev.upvotes - 1, score: prev.score - 1 };
      }
      if (prev.vote === 'down') {
        return {
          ...prev,
          vote: 'up',
          upvotes: prev.upvotes + 1,
          downvotes: prev.downvotes - 1,
          score: prev.score + 2,
        };
      }
      return { ...prev, vote: 'up', upvotes: prev.upvotes + 1, score: prev.score + 1 };
    });
  };

  const toggleDownvote = () => {
    setState(prev => {
      if (prev.vote === 'down') {
        return { ...prev, vote: null, downvotes: prev.downvotes - 1, score: prev.score + 1 };
      }
      if (prev.vote === 'up') {
        return {
          ...prev,
          vote: 'down',
          upvotes: prev.upvotes - 1,
          downvotes: prev.downvotes + 1,
          score: prev.score - 2,
        };
      }
      return { ...prev, vote: 'down', downvotes: prev.downvotes + 1, score: prev.score - 1 };
    });
  };

  const toggleFave = () => {
    setState(prev => ({ ...prev, faved: !prev.faved, faves: prev.faves + (prev.faved ? -1 : 1) }));
  };

  const toggleHidden = () => {
    setState(prev => ({ ...prev, hidden: !prev.hidden }));
  };

  return { ...state, toggleUpvote, toggleDownvote, toggleFave, toggleHidden };
}
