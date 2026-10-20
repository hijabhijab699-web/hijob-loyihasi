// Minimal Pages Router _error shim.
// App Router owns real 404/500 (`app/not-found.tsx`, `app/error.tsx`).
// Next.js still generates a Pages Router fallback; this stub keeps that
// fallback from pulling in <Html>/<Main>/<Head> which crashes the build
// when the app is App-Router-only.

function Error({ statusCode }: { statusCode: number }) {
  return <p>Xatolik {statusCode}</p>;
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode: number }; err?: { statusCode: number } }) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default Error;
