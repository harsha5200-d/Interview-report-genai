import React from "react";
import { Link, useRouteError } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();
  // keep a console trace for debugging in dev
  // eslint-disable-next-line no-console
  console.error("Route error:", error);

  const status = error?.status || error?.statusCode;
  const statusText = error?.statusText || (error && error.message) || "Not Found";

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "32px auto", fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Unexpected Application Error</h1>
      <p style={{ color: '#666', marginTop: 0 }}>{status ? `${status} — ${statusText}` : statusText}</p>

      {error?.data && (
        <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
          {typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}
        </pre>
      )}

      <div style={{ marginTop: 18 }}>
        <Link to="/" style={{ color: '#0b66ff' }}>Return to Home</Link>
      </div>

      <div style={{ marginTop: 18, color: '#999', fontSize: 13 }}>
        <div>Tip: implement an `ErrorBoundary` or improve route `errorElement` content.</div>
      </div>
    </div>
  );
}
