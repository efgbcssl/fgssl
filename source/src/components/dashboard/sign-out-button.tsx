// src/app/dashboard/sign-out-button.tsx
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-red-600 hover:text-red-700"
        >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
        </Button>
    );
}
