"use client";

import { useUser } from "@clerk/nextjs";

export default function HeroPage() {
  const { isSignedIn, user } = useUser();

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user.firstName || user.username}!
          </h1>
          <p className="text-xl text-gray-600">Successfully signed in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to Our Platform
        </h1>
        <p className="text-xl md:text-2xl text-gray-600">
          Get started by signing in or creating an account
        </p>
      </div>
    </div>
  );
}
