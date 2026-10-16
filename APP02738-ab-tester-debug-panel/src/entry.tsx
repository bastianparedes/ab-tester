import ReactDOM from 'react-dom/client';
import App from './App';
import tailwindInline from './tailwind.css?inline';

(() => {
  const styleContainer = document.createElement('style');
  styleContainer.textContent = tailwindInline;
  document.head.appendChild(styleContainer);

  const componentContainer = document.createElement('div');
  document.body.appendChild(componentContainer);

  const root = ReactDOM.createRoot(componentContainer);
  root.render(<App />);
})();
