"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, ChevronDown, LayoutDashboard, RefreshCw } from "lucide-react";

export type ExecutiveRole = "group" | "ceo" | "coo" | "cpo" | "cro";

interface DashboardHeaderProps {
  role: ExecutiveRole;
  onRoleChange: (role: ExecutiveRole) => void;
  lastUpdated: string;
  onRefresh?: () => void;
}

const roleConfig = {
  group: {
    label: "Group",
    fullTitle: "Snapshot · all roles",
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    avatar: "EX",
  },
  ceo: {
    label: "CEO",
    fullTitle: "Chief Executive Officer",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    avatar: "CE",
  },
  coo: {
    label: "COO",
    fullTitle: "Chief Operating Officer",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    avatar: "CO",
  },
  cpo: {
    label: "CPO",
    fullTitle: "Chief Product Officer",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    avatar: "CP",
  },
  cro: {
    label: "CRO",
    fullTitle: "Chief Revenue Officer",
    color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    avatar: "CR",
  },
};

export function DashboardHeader({
  role,
  onRoleChange,
  lastUpdated,
  onRefresh,
}: DashboardHeaderProps) {
  const config = roleConfig[role];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Executive Dashboard
                </h1>
                <p className="text-xs text-zinc-500 hidden sm:block">
                  Publisher Analytics Platform
                </p>
              </div>
            </div>
          </div>

          {/* Center: Live indicator */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-zinc-400">Live</span>
            </div>
            <button
              type="button"
              onClick={() => onRefresh?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 text-xs rounded-full hover:bg-zinc-800/80 hover:text-zinc-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Updated {lastUpdated}
            </button>
          </div>

          {/* Right: Role Selector & User */}
          <div className="flex items-center gap-4">
            {/* Role Selector */}
            <Select value={role} onValueChange={(v) => onRoleChange(v as ExecutiveRole)}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="group" className="text-white hover:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full" />
                    Group snapshot
                  </div>
                </SelectItem>
                <SelectItem value="ceo" className="text-white hover:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    CEO View
                  </div>
                </SelectItem>
                <SelectItem value="coo" className="text-white hover:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    COO View
                  </div>
                </SelectItem>
                <SelectItem value="cpo" className="text-white hover:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                    CPO View
                  </div>
                </SelectItem>
                <SelectItem value="cro" className="text-white hover:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-violet-500 rounded-full" />
                    CRO View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                <Avatar className="h-9 w-9 border-2 border-zinc-700">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-sm font-semibold">
                    {config.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{config.label}</p>
                  <p className="text-xs text-zinc-500">{config.fullTitle}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400 hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-zinc-900 border-zinc-700"
              >
                <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                  <Activity className="w-4 h-4 mr-2" />
                  Activity Log
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
