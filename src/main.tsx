import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 🔴 修复水合错误：确保DOM完全准备好后再挂载
function HydratedApp() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HydratedApp />
  </StrictMode>
);
