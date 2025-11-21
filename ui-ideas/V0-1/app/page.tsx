"use client"

import { useState } from "react"
import { AdminView } from "@/components/admin-view"
import { User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "chatflows" | "analytics" | "settings">("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <Image
                src="/ioZen-Dark-Logo-(1)-8VH0h.svg"
                alt="ioZen Logo"
                width={160}
                height={80}
                className="h-16 w-auto md:h-20"
              />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              Feedback
            </Button>
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              Changelog
            </Button>
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              Help
            </Button>
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              Docs
            </Button>
            <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
              <User className="h-4 w-4 text-neutral-400" />
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
              <User className="h-4 w-4 text-neutral-400" />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex px-4 md:px-6 items-center gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`h-12 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "dashboard"
                ? "border-white text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("chatflows")}
            className={`h-12 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "chatflows"
                ? "border-white text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Chatflows
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`h-12 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-white text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`h-12 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-white text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Settings
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-black border-b border-neutral-800 p-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5 z-50">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Navigation</div>
              <button
                onClick={() => {
                  setActiveTab("dashboard")
                  setIsMobileMenuOpen(false)
                }}
                className={`flex items-center h-10 px-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab("chatflows")
                  setIsMobileMenuOpen(false)
                }}
                className={`flex items-center h-10 px-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "chatflows"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                Chatflows
              </button>
              <button
                onClick={() => {
                  setActiveTab("analytics")
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center h-10 px-2 rounded-md text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              >
                Analytics
              </button>
              <button
                onClick={() => {
                  setActiveTab("settings")
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center h-10 px-2 rounded-md text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              >
                Settings
              </button>
            </div>

            <div className="h-px bg-neutral-800 my-2" />

            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Support</div>
              <button className="flex items-center h-10 px-2 rounded-md text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                Feedback
              </button>
              <button className="flex items-center h-10 px-2 rounded-md text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                Changelog
              </button>
              <button className="flex items-center h-10 px-2 rounded-md text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                Help
              </button>
              <button className="flex items-center h-10 px-2 rounded-md text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                Docs
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
        <AdminView activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  )
}
