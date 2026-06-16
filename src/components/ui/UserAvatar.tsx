"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  userId?: string;
  className?: string;
  bust?: number;
}

const sizeMap = {
  sm: { container: "h-7 w-7", icon: "h-3.5 w-3.5", text: "text-[10px]" },
  md: { container: "h-8 w-8", icon: "h-4 w-4", text: "text-xs" },
  lg: { container: "h-12 w-12", icon: "h-5 w-5", text: "text-base" },
};

export function UserAvatar({ size = "md", userId, className = "", bust = 0 }: UserAvatarProps) {
  const { data: session } = useSession();
  const [imgError, setImgError] = useState(false);
  const s = sizeMap[size];
  const id = userId || (session?.user?.id as string);
  const name = session?.user?.name || "";

  const handleError = useCallback(() => {
    setImgError(true);
  }, []);

  if (id && !imgError) {
    return (
      <img
        key={bust}
        src={`/api/user/avatar/${id}${bust ? `?t=${bust}` : ""}`}
        alt={name}
        className={`${s.container} shrink-0 rounded-full object-cover bg-surface border border-border ${className}`}
        onError={handleError}
      />
    );
  }

  return (
    <div className={`${s.container} shrink-0 rounded-full bg-accent flex items-center justify-center ${className}`}>
      {name ? (
        <span className={`${s.text} font-bold text-white`}>{name.charAt(0).toUpperCase()}</span>
      ) : (
        <User className={`${s.icon} text-white`} />
      )}
    </div>
  );
}
