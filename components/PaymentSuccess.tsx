import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface StripeSession {
  payment_status?: string;
  status?: string;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'success' | 'pending' | null>(null);

  // Parse query param ?session_id=...
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found in URL.');
      setLoading(false);
      return;
    }

    async function fetchSession() {
      try {
        const res = await fetch(`/api/checkout-session/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch session');
        const session: StripeSession = await res.json();

        if (session.payment_status === 'paid' || session.status === 'complete') {
          setSessionStatus('success');
        } else {
          setSessionStatus('pending');
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSession();

    // Redirect after 4 seconds
    const timer = setTimeout(() => {
      navigate('/sign-in');
    }, 4000);

    return () => clearTimeout(timer);
  }, [sessionId, navigate]);

  if (loading) return <p>Loading payment details...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      {sessionStatus === 'success' ? (
        <>
          <h1>🎉 Payment Successful!</h1>
          <p>Thank you for subscribing.</p>
          <p>Redirecting you to the sign-in page...</p>
        </>
      ) : (
        <>
          <h1>⏳ Payment Pending</h1>
          <p>Your payment is processing. Please wait a moment and try again later if this message persists.</p>
        </>
      )}
    </div>
  );
}
