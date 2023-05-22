import { useCallback, useEffect, useRef } from "react";

function useIsComponentMounted() {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

export default useIsComponentMounted;
