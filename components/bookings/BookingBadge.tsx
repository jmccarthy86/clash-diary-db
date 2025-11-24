import * as React from "react";
import { Badge } from "../ui/badge";

export const BadgeVariants = {
    P: { bg: "bg-red-500", text: "text-white" },
    OPERA_DANCE: { bg: "bg-blue-500", text: "text-white" },
    GALA_NIGHT: { bg: "bg-green-500", text: "text-white" },
    SOLT_MEMBER: { bg: "bg-solt-purple", text: "text-white" },
    SOLT_MEMBER_NON_SOLT: { bg: "bg-yellow-200", text: "text-black" },
    AFFILATE_VENUE: { bg: "bg-solt-gold", text: "text-black" },
    UKT_VENUE: { bg: "bg-solt-red", text: "text-white" },
};

export default function BookingBadge({
    type,
    children,
}: {
    type: keyof typeof BadgeVariants;
    children: React.ReactNode;
}) {
    return (
        <Badge
            variant="outline"
            className={`mr-2 ${BadgeVariants[type].bg} ${BadgeVariants[type].text} px-2.5 py-1 text-[10px] leading-tight rounded-md whitespace-nowrap`}
        >
            {children}
        </Badge>
    );
}
