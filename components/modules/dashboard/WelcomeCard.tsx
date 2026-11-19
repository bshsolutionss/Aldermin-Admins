"use client";

import React, { useEffect, useState } from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { apiService, UserAccount } from "@/lib/api-service";

export function WelcomeCard() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiService.auth
      .getMe()
      .then((user) => {
        if (isMounted) setCurrentUser(user);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const recipient = currentUser?.name
    ? `${currentUser.name}!`
    : "School Team!";

  return (
    <AdminCard className="h-full p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-center group min-h-[220px]">
      {/* Text Section */}
      <div className="flex-1 z-10 max-w-xl mb-6 md:mb-0 text-center md:text-left">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
          Welcome back,{" "}
          <span className="text-secondary block sm:inline">
            {recipient}
          </span>
        </h2>
        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base font-medium max-w-md mx-auto md:mx-0">
          Manage your school operations with ease. Stay updated on academics,
          attendance, finances, and more — all in one place.
        </p>
      </div>

      {/* Image Section */}
      <div className="flex-shrink-0 relative z-10 w-full md:w-auto flex justify-center">
        <img
          src="/assets/images/dashboard-img/img-1.png"
          alt="Dashboard Illustration"
          className="h-32 sm:h-48 md:h-52 object-contain drop-shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-rotate-2"
          onError={(e) =>
            ((e.target as HTMLImageElement).style.display = "none")
          }
        />
      </div>

      {/* Decorative gradient blob */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
    </AdminCard>
  );
}
