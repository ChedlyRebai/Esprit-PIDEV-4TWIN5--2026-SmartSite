"use client";

import { useParams } from "react-router";
import { useEffect } from "react";

export default function UserGuide() {
  const { role } = useParams();

  useEffect(() => {
    // Redirect to the static HTML file
    window.location.href = `/user-guide/${role}.html`;
  }, [role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading guide...</p>
      </div>
    </div>
  );
}
