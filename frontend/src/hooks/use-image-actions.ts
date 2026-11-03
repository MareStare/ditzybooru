import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useSession } from '#/hooks/use-session';
import { interact } from '#/lib/api/backend/content';
import type { ImageActivity, ImageCounters, InteractionAction } from '#/lib/api/backend/content';
import { imageActivityQuery } from '#/lib/api/queries';

interface ImageActions {
  /** Whether the visitor is signed in, which is what lets them act. */
  signedIn: boolean;
  counters: ImageCounters;
  /** What they have done to this image; `undefined` until the site says. */
  activity: ImageActivity | undefined;
  act: (action: InteractionAction) => void;
  busy: boolean;
  failed: boolean;
}

/**
 * Vote, fave and hide on one image. The counters start as the page had them
 * and become what the site answers after each action; what the visitor did
 * before comes from the site's page, with their cookie.
 */
export function useImageActions(id: number, initial: ImageCounters): ImageActions {
  const session = useSession();
  const signedIn = session?.signedIn === true;
  const queryClient = useQueryClient();
  const [counters, setCounters] = useState(initial);
  const activity = useQuery({ ...imageActivityQuery(id), enabled: signedIn });
  const mutation = useMutation({
    mutationFn: (action: InteractionAction) => interact(id, action),
    onSuccess: answer => {
      setCounters(answer);
      // A fave also upvotes, so ask again rather than guess what changed.
      void queryClient.invalidateQueries({ queryKey: imageActivityQuery(id).queryKey });
    },
  });

  return {
    signedIn,
    counters,
    activity: activity.data,
    act: action => {
      mutation.mutate(action);
    },
    busy: mutation.isPending,
    failed: mutation.isError,
  };
}
