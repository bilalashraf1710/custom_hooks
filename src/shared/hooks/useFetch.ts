import { useEffect, useReducer, useRef } from "react";

interface State<T> {
  data?: T;
  error?: Error;
}

enum ActionType {
  LOADING = "loading",
  FETCHED = "fetched",
  ERROR = "error",
}

type Cache<T> = { [url: string]: T };

// discriminated union type
type Action<T> =
  | { type: ActionType.LOADING }
  | { type: ActionType.FETCHED; payload: T }
  | { type: ActionType.ERROR; payload: Error };

function useFetch<T = unknown>(url?: string, options?: RequestInit): State<T> {
  const cache = useRef<Cache<T>>({});

  // Used to prevent state update if the component is unmounted
  const cancelRequest = useRef<boolean>(false);

  const initialState: State<T> = {
    error: undefined,
    data: undefined,
  };

  // Keep state logic separated
  const fetchReducer = (state: State<T>, action: Action<T>): State<T> => {
    switch (action.type) {
      case ActionType.LOADING:
        return { ...initialState };
      case ActionType.FETCHED:
        return { ...initialState, data: action.payload };
      case ActionType.ERROR:
        return { ...initialState, error: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    // Do nothing if the url is not given
    if (!url) return;

    cancelRequest.current = false;

    const fetchData = async () => {
      dispatch({ type: ActionType.LOADING });

      // If a cache exists for this url, return it
      if (cache.current[url]) {
        dispatch({ type: ActionType.FETCHED, payload: cache.current[url] });
        return;
      }

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = (await response.json()) as T;
        cache.current[url] = data;
        if (cancelRequest.current) return;

        dispatch({ type: ActionType.FETCHED, payload: data });
      } catch (error) {
        if (cancelRequest.current) return;

        dispatch({ type: ActionType.ERROR, payload: error as Error });
      }
    };

    void fetchData();

    // Use the cleanup function for avoiding a possibly...
    // ...state update after the component was unmounted
    return () => {
      cancelRequest.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return state;
}

export default useFetch;
