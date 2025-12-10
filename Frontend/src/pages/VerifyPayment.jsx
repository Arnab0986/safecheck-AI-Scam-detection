// src/pages/VerifyPayment.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function VerifyPayment() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking"); // checking | success | pending | failed | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setMessage("Invalid payment request — missing order ID.");
      return;
    }
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const verify = async () => {
    try {
      const res = await api.post("/payment/verify", { orderId });

      if (!res.data?.success) {
        setStatus("error");
        setMessage("Verification failed. Try again.");
        return;
      }

      const result = res.data.data;

      switch (result.status) {
        case "PAID":
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 2000);
          break;

        case "PENDING":
          setStatus("pending");
          setMessage("Payment is still processing… retrying automatically.");
          setTimeout(() => verify(), 3000);
          break;

        case "FAILED":
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
          break;

        default:
          setStatus("error");
          setMessage("Unknown payment state received.");
      }

    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Server error while verifying payment.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      {status === "checking" && (
        <>
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-lg">Verifying your payment...</p>
        </>
      )}

      {status === "pending" && (
        <>
          <div className="h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-yellow-600 font-medium">Payment is processing…</p>
          <p className="mt-2 text-gray-500 text-sm">{message}</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
          <p className="mt-2 text-gray-600">Redirecting to dashboard…</p>
        </>
      )}

      {status === "failed" && (
        <>
          <div className="text-red-600 text-5xl mb-4">✕</div>
          <h2 className="text-2xl font-bold text-red-700">Payment Failed</h2>
          <p className="mt-2 text-gray-600">{message}</p>
          <button onClick={() => navigate("/pricing")} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Try Again</button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-red-600 text-5xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-red-700">Verification Error</h2>
          <p className="mt-2 text-gray-600">{message}</p>
          <button onClick={() => verify()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Retry Verification</button>
        </>
      )}
    </div>
  );
}
