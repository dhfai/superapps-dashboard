"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconLayoutGrid,
  IconClipboardList,
  IconPresentationAnalytics,
} from "@tabler/icons-react"

import { NavCollapsible } from "@/components/Navigation/NavCollapsible"
import { NavDocuments } from "@/components/Navigation/NavDocuments"
import { NavMain } from "@/components/Navigation/NavMain"
import { NavSecondary } from "@/components/Navigation/NavSecondary"
import { NavUser } from "@/components/Navigation/NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    // {
    //   title: "Dashboard",
    //   url: "/dashboard",
    //   icon: IconDashboard,
    // },
    // {
    //   title: "Lifecycle",
    //   url: "#",
    //   icon: IconListDetails,
    // },
    // {
    //   title: "Analytics",
    //   url: "#",
    //   icon: IconChartBar,
    // },
    // {
    //   title: "Projects",
    //   url: "#",
    //   icon: IconFolder,
    // },
    // {
    //   title: "Team",
    //   url: "#",
    //   icon: IconUsers,
    // },
  ],
  // Kategori Workspace dengan dropdown
  workspace: [
    {
      title: "Overview",
      url: "/workspace/overview",
      icon: IconLayoutGrid,
    },
    {
      title: "Projects",
      url: "#",
      icon: IconFolder,
      isActive: true,
      items: [
        {
          title: "Active Projects",
          url: "/workspace/projects/active",
        },
        {
          title: "Archived",
          url: "/workspace/projects/archived",
        },
        {
          title: "Templates",
          url: "/workspace/projects/templates",
        },
      ],
    },
    {
      title: "Tasks",
      url: "#",
      icon: IconClipboardList,
      items: [
        {
          title: "My Tasks",
          url: "/workspace/tasks/my-tasks",
        },
        {
          title: "Assigned to Me",
          url: "/workspace/tasks/assigned",
        },
        {
          title: "Completed",
          url: "/workspace/tasks/completed",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: IconPresentationAnalytics,
      items: [
        {
          title: "Performance",
          url: "/workspace/reports/performance",
        },
        {
          title: "Analytics",
          url: "/workspace/reports/analytics",
        },
        {
          title: "Export Data",
          url: "/workspace/reports/export",
        },
      ],
    },
  ],
  catatan: [
    {
      title: "Money Management",
      url: "/dashboard/money-management/",
      icon: IconLayoutGrid,
    },
    {
      title: "Target Harian",
      url: "#",
      icon: IconFolder,
      isActive: true,
      items: [
        {
          title: "Target Profit",
          url: "/dashboard/money-management/profit",
        },
        {
          title: "Progress",
          url: "/dashboard/money-management/progress",
        },
        {
          title: "Templates",
          url: "/dashboard/money-management/templates",
        },
      ],
    },
    {
      title: "Tasks",
      url: "#",
      icon: IconClipboardList,
      items: [
        {
          title: "My Tasks",
          url: "/workspace/tasks/my-tasks",
        },
        {
          title: "Assigned to Me",
          url: "/workspace/tasks/assigned",
        },
        {
          title: "Completed",
          url: "/workspace/tasks/completed",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: IconPresentationAnalytics,
      items: [
        {
          title: "Performance",
          url: "/workspace/reports/performance",
        },
        {
          title: "Analytics",
          url: "/workspace/reports/analytics",
        },
        {
          title: "Export Data",
          url: "/workspace/reports/export",
        },
      ],
    },
  ],
  // Kategori Content dengan dropdown
  content: [
    {
      title: "Capture",
      icon: IconCamera,
      url: "#",
      items: [
        {
          title: "New Capture",
          url: "/content/capture/new",
        },
        {
          title: "Recent",
          url: "/content/capture/recent",
        },
        {
          title: "Archived",
          url: "/content/capture/archived",
        },
      ],
    },
    {
      title: "Proposals",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "/content/proposals/active",
        },
        {
          title: "Drafts",
          url: "/content/proposals/drafts",
        },
        {
          title: "Archived",
          url: "/content/proposals/archived",
        },
      ],
    },
    {
      title: "AI Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "My Prompts",
          url: "/content/prompts/my-prompts",
        },
        {
          title: "Templates",
          url: "/content/prompts/templates",
        },
        {
          title: "Shared",
          url: "/content/prompts/shared",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />


        {/* Kategori Catatan dengan Dropdown */}
        <NavCollapsible items={data.catatan} label="Catatan" />

        {/* Kategori Workspace dengan Dropdown */}
        <NavCollapsible items={data.workspace} label="Workspace" />

        {/* Kategori Content dengan Dropdown */}
        <NavCollapsible items={data.content} label="Content" />

        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
