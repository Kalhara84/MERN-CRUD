import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const FlashContext = createContext(null);
let nextId = 1;

export function FlashProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const dismiss = useCallback((id) => setMessages((m) => m.filter((x) => x.id !== id)), []);

  const add = useCallback((type, text) => {
    const id = nextId++;
    setMessages((m) => [...m, { id, type, text }]);
    setTimeout(() => dismiss(id), 6000); // disappears after 6 seconds
  }, [dismiss]);

  const value = useMemo(
    () => ({
      messages,
      dismiss,
      success: (t) => add('success', t),
      error: (t) => add('danger', t),
    }),
    [messages, dismiss, add]
  );
  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
}

export const useFlash = () => useContext(FlashContext);
