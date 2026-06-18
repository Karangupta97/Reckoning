"use client";



import { useMemo } from "react";

import { motion } from "framer-motion";

import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

import {

  ShieldAlert,

  CheckCircle2,

  AlertTriangle,

  UserCheck,

  ClipboardList,

  FileText,

} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { AdminNotification, AdminNotificationType } from "@/store/adminNotificationStore";

import { useAdminNotifications } from "@/hooks/useAdminNotifications";



type IconVariant = "teal" | "emerald" | "cyan" | "danger" | "amber";



const iconVariantClass: Record<IconVariant, string> = {

  teal: "da-activity-timeline-icon-teal",

  emerald: "da-activity-timeline-icon-emerald",

  cyan: "da-activity-timeline-icon-cyan",

  danger: "activity-timeline-icon-danger",

  amber: "activity-timeline-icon-amber",

};



function iconForType(type: AdminNotificationType): { icon: LucideIcon; variant: IconVariant } {

  switch (type) {

    case "escalation_new":

    case "escalation_escalated":

      return { icon: ShieldAlert, variant: "danger" };

    case "resolution_submitted":

    case "resolution_decision":

      return { icon: CheckCircle2, variant: "emerald" };

    case "ticket_submitted":

      return { icon: ClipboardList, variant: "cyan" };

    case "evidence_submitted":

      return { icon: FileText, variant: "teal" };

    case "clarification_request":

      return { icon: AlertTriangle, variant: "amber" };

    default:

      return { icon: UserCheck, variant: "teal" };

  }

}



function ActivityFeedContent({ activities }: { activities: AdminNotification[] }) {

  return (

    <DashboardCard

      initial={{ opacity: 0, y: 14 }}

      animate={{ opacity: 1, y: 0 }}

      className="flex h-full flex-col p-5"

    >

      <div className="activity-feed-header">

        <div>

          <h3 className="text-primary text-sm font-semibold lg:text-base">

            Operations Feed

          </h3>

          <p className="text-muted mt-1 text-xs">Real-time district activity</p>

        </div>

        <button type="button" className="da-btn-secondary shrink-0 !h-9 !px-3 !text-xs">

          View All

        </button>

      </div>



      <div className="activity-timeline min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "color-mix(in srgb, var(--da-teal) 25%, transparent) transparent" }}>

        <div

          className="activity-timeline-line da-activity-timeline-line"

          aria-hidden

        />



        <ul className="activity-timeline-list">

          {activities.length === 0 ? (

            <li className="text-xs text-[var(--color-text-muted)] py-4">No recent activity</li>

          ) : (

            activities.map((activity, index) => {

              const { icon: Icon, variant } = iconForType(activity.type);

              return (

                <motion.li

                  key={activity.id}

                  initial={{ opacity: 0, x: -10 }}

                  animate={{ opacity: 1, x: 0 }}

                  transition={{ delay: index * 0.05 }}

                  className="activity-timeline-item"

                >

                  <div

                    className={`activity-timeline-icon ${iconVariantClass[variant]}`}

                  >

                    <Icon size={16} aria-hidden />

                  </div>



                  <div className="activity-timeline-body">

                    <div className="activity-timeline-meta">

                      <h4 className="activity-timeline-title">{activity.title}</h4>

                      <time className="activity-timeline-time">{activity.timestamp}</time>

                    </div>

                    <p className="activity-timeline-desc">{activity.message}</p>

                  </div>

                </motion.li>

              );

            })

          )}

        </ul>

      </div>

    </DashboardCard>

  );

}



export default function DistrictActivityFeed() {

  const allNotifications = useAdminNotifications();

  const activities = useMemo(

    () => allNotifications.filter((x) => x.portal === "district").slice(0, 6),

    [allNotifications]

  );



  return <ActivityFeedContent activities={activities} />;

}


