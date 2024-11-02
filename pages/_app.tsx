import 'react-quill/dist/quill.snow.css';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
// ... rest of your imports

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
