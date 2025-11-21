"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  ArrowRight,
  Check,
  Calendar,
  Hash,
  Type,
  ImageIcon,
  List,
  Settings2,
  ExternalLink,
  Loader2,
  LayoutTemplate,
  PlayCircle,
  MessageSquare,
  Sparkles,
  FileText,
  Clock,
  Share2,
  X,
  Trash2,
  BarChart3,
} from "lucide-react"

type ViewState = "list" | "create" | "edit" | "success" | "submissions" | "submission-detail"

export function AdminView({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: any) => void }) {
  const [view, setView] = useState<ViewState>("list")
  const [isGenerating, setIsGenerating] = useState(false)

  if (activeTab === "dashboard") {
    return (
      <DashboardView
        onCreateNew={() => {
          onTabChange("chatflows")
          setView("create")
        }}
      />
    )
  }

  if (activeTab !== "chatflows") {
    return (
      <div className="flex items-center justify-center h-[50vh] text-neutral-500">
        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View Coming Soon
      </div>
    )
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setView("edit")
    }, 1500)
  }

  const handlePublish = () => {
    setView("success")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumbs / Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          {view === "list" && "Chatflows"}
          {view === "create" && "Create New Chatflow"}
          {view === "edit" && "Configure Fields"}
          {view === "success" && "Chatflow Published"}
          {view === "submissions" && "Submissions: Insurance Claim Bot"}
          {view === "submission-detail" && "Submission Details"}
        </h1>
        {view === "list" && (
          <Button
            onClick={() => setView("create")}
            className="bg-white text-black hover:bg-neutral-200 w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Chatflow
          </Button>
        )}
        {view !== "list" && view !== "success" && (
          <Button
            variant="ghost"
            onClick={() => setView("list")}
            className="text-neutral-400 hover:text-white w-full md:w-auto justify-start md:justify-center"
          >
            Cancel
          </Button>
        )}
      </div>

      {view === "list" && <ChatflowList onView={() => setView("edit")} onSubmissions={() => setView("submissions")} />}
      {view === "create" && <CreateChatflow onGenerate={handleGenerate} isGenerating={isGenerating} />}
      {view === "edit" && <EditFields onPublish={handlePublish} />}
      {view === "success" && <SuccessView onBack={() => setView("list")} />}
      {view === "submissions" && (
        <SubmissionsView onBack={() => setView("list")} onViewDetail={() => setView("submission-detail")} />
      )}
      {view === "submission-detail" && <SubmissionDetailView onBack={() => setView("submissions")} />}
    </div>
  )
}

function DashboardView({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-neutral-400 mt-1">Welcome to My Workspace</p>
        </div>
        <Button onClick={onCreateNew} className="bg-white text-black hover:bg-neutral-200 w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Chatflow
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Chatflows" value="1" icon={MessageSquare} />
        <MetricCard title="Total Submissions" value="0" icon={BarChart3} />
        <MetricCard title="This Week" value="0" icon={BarChart3} />
      </div>

      {/* Recent Chatflows */}
      <div className="space-y-4 pt-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-white">Recent Chatflows</h2>
          <p className="text-sm text-neutral-400">Your latest chatflows and their submission counts</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-black overflow-hidden">
          <div
            className="flex items-center justify-between p-4 hover:bg-neutral-900 transition-colors cursor-pointer group"
            onClick={onCreateNew}
          >
            <div>
              <div className="font-medium text-neutral-200 group-hover:text-white transition-colors">
                Montessori Registration Form
              </div>
              <div className="text-sm text-neutral-500">0 submissions</div>
            </div>
            <Badge variant="outline" className="bg-neutral-950 border-neutral-800 text-neutral-400">
              Draft
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <Card className="bg-black border-neutral-800">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-neutral-400" />
        </div>
        <div>
          <div className="text-2xl font-semibold text-white">{value}</div>
          <div className="text-sm text-neutral-500">{title}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChatflowList({ onView, onSubmissions }: { onView: () => void; onSubmissions: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search chatflows..."
            className="pl-9 bg-black border-neutral-800 focus-visible:ring-neutral-700"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button
            variant="outline"
            className="bg-black border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 whitespace-nowrap"
          >
            All Environments
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-black overflow-hidden">
        {/* Hidden header on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Submissions</div>
          <div className="col-span-3">Last Updated</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {[
          { name: "Insurance Claim Bot", submissions: 124, date: "2m ago", status: "Active" },
          { name: "Customer Support V1", submissions: 0, date: "1h ago", status: "Building" },
          { name: "Lead Gen Form", submissions: 892, date: "2d ago", status: "Active" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 items-start md:items-center hover:bg-neutral-900 transition-colors border-b border-neutral-800 last:border-0 group"
          >
            {/* Adjusted column spans and layout for mobile */}
            <div className="w-full md:w-auto md:col-span-4 flex items-center gap-3 cursor-pointer" onClick={onView}>
              <div className="h-8 w-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="h-4 w-4 text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
                  {item.name}
                </div>
                <div className="text-xs text-neutral-500 font-mono">id: {Math.random().toString(36).substring(7)}</div>
              </div>
              {/* Show status badge on mobile next to name */}
              <div className="md:hidden">
                <Badge variant="outline" className="bg-neutral-950 border-neutral-800 text-neutral-400">
                  {item.status}
                </Badge>
              </div>
            </div>

            <div
              className="w-full md:w-auto md:col-span-3 flex items-center justify-between md:justify-start gap-2 cursor-pointer"
              onClick={onSubmissions}
            >
              <span className="md:hidden text-sm text-neutral-500">Submissions:</span>
              <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">{item.submissions}</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="w-full md:w-auto md:col-span-3 text-sm text-neutral-500 flex justify-between md:block">
              <span className="md:hidden">Last Updated:</span>
              {item.date}
            </div>

            <div className="hidden md:flex col-span-2 justify-end">
              <Badge variant="outline" className="bg-neutral-950 border-neutral-800 text-neutral-400">
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CreateChatflow({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-black border-neutral-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-xl">Describe your Chatflow</CardTitle>
          </div>
          <CardDescription className="text-neutral-400">
            Our AI will analyze your requirements and generate the necessary fields and logic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Prompt</label>
            <Textarea
              placeholder="e.g. I need a chatflow for collecting car insurance claims. It should ask for the policy number, date of incident, description, and photos of the damage."
              className="min-h-[200px] bg-neutral-950 border-neutral-800 focus-visible:ring-blue-900/50 resize-none text-base leading-relaxed placeholder:text-neutral-600"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-white text-black hover:bg-neutral-200 min-w-[140px] transition-all duration-300"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EditFields({ onPublish }: { onPublish: () => void }) {
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config")
  const [selectedField, setSelectedField] = useState<any>(null)

  const fields = [
    {
      name: "policy_number",
      label: "Policy Number",
      type: "text",
      icon: Hash,
      required: true,
      description: "The unique identifier for the insurance policy.",
    },
    {
      name: "incident_date",
      label: "Date of Incident",
      type: "date",
      icon: Calendar,
      required: true,
      description: "When did the accident happen?",
    },
    {
      name: "description",
      label: "Incident Description",
      type: "long_text",
      icon: Type,
      required: true,
      description: "Detailed account of the event.",
    },
    {
      name: "damage_photos",
      label: "Damage Photos",
      type: "image",
      icon: ImageIcon,
      required: false,
      description: "Upload images of the vehicle damage.",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex justify-center flex-shrink-0">
        <div className="bg-neutral-900/50 p-1 rounded-lg border border-neutral-800 inline-flex w-full md:w-auto">
          <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "config" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "preview"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "config" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-start">
            {/* Field List Column */}
            <Card
              className={`bg-black border-neutral-800 md:col-span-4 transition-all duration-300 ${selectedField ? "hidden md:block" : "block"}`}
            >
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 gap-4 border-b border-neutral-800/50">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg">Fields</CardTitle>
                  <CardDescription className="text-neutral-400 hidden md:block">Manage your fields.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 hover:border-neutral-700 transition-all duration-300 group bg-transparent"
                >
                  <div className="h-4 w-4 rounded-full bg-neutral-800 group-hover:bg-blue-500/20 flex items-center justify-center mr-2 transition-colors">
                    <Plus className="h-3 w-3 group-hover:text-blue-400 transition-colors" />
                  </div>
                  Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 pt-4 px-4 pb-4">
                {fields.map((field, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedField(field)}
                    className={`group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedField?.name === field.name
                        ? "bg-neutral-900 border-blue-500/50 ring-1 ring-blue-500/20"
                        : "bg-neutral-950/30 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                        selectedField?.name === field.name
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 group-hover:text-white group-hover:border-neutral-600"
                      }`}
                    >
                      <field.icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-neutral-200 text-sm truncate">{field.label}</div>
                        {selectedField?.name === field.name && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      </div>
                      <div className="text-xs font-mono text-neutral-500 truncate">{field.name}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Configuration Pane - Right Column (Desktop) / Full Overlay (Mobile) */}
            {selectedField ? (
              <Card className="md:col-span-8 bg-black border-neutral-800 h-fit sticky top-4 animate-in slide-in-from-right-4 duration-300 fixed inset-0 z-50 md:static md:z-auto m-0 md:m-0 flex flex-col shadow-2xl md:shadow-none w-full h-full md:h-auto">
                <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 bg-neutral-900/50 md:bg-transparent px-6 pt-0 pb-0">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Edit Field</CardTitle>
                    <CardDescription className="text-sm">
                      Configure properties for <span className="text-white font-medium">{selectedField.label}</span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedField(null)}
                    className="h-10 w-10 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6 px-6 overflow-y-auto flex-1 bg-black md:bg-transparent pt-0 pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Label</label>
                      <Input
                        defaultValue={selectedField.label}
                        className="bg-neutral-950 border-neutral-800 focus-visible:ring-blue-900/50 h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Variable Name
                      </label>
                      <Input
                        defaultValue={selectedField.name}
                        className="bg-neutral-950 border-neutral-800 font-mono text-sm focus-visible:ring-blue-900/50 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Description / Helper Text
                    </label>
                    <Textarea
                      defaultValue={selectedField.description}
                      className="bg-neutral-950 border-neutral-800 min-h-[120px] resize-none focus-visible:ring-blue-900/50 leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</label>
                      <div className="px-4 py-3 rounded-md border border-neutral-800 bg-neutral-950 text-sm text-neutral-300 flex items-center gap-3">
                        <selectedField.icon className="h-4 w-4 text-neutral-500" />
                        {selectedField.type}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Required</label>
                      <div className="flex items-center h-[46px] px-1">
                        <div
                          className={`h-6 w-11 rounded-full p-1 transition-colors cursor-pointer ${selectedField.required ? "bg-blue-600" : "bg-neutral-800"}`}
                        >
                          <div
                            className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${selectedField.required ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </div>
                        <span className="ml-3 text-sm text-neutral-300">{selectedField.required ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-800 flex flex-col md:flex-row gap-4">
                    <Button className="flex-1 bg-white text-black hover:bg-neutral-200 h-11 text-base font-medium">
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-900/30 text-red-500 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 h-11 bg-transparent"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Field
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="hidden md:flex md:col-span-8 bg-neutral-950/30 border-neutral-800 h-full min-h-[500px] items-center justify-center text-center p-8">
                <div className="space-y-6 max-w-[280px]">
                  <div className="h-20 w-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto shadow-xl">
                    <Settings2 className="h-10 w-10 text-neutral-700" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-medium text-neutral-200 text-xl">No Field Selected</h3>
                    <p className="text-neutral-500 leading-relaxed">
                      Select a field from the list on the left to edit its properties, validation rules, and appearance.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6">
            <Card className="bg-black border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Preview</CardTitle>
                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-4 min-h-[300px] flex flex-col justify-end">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-800 flex-shrink-0" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-neutral-800 rounded" />
                      <div className="h-16 w-full bg-neutral-800 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="h-8 w-8 rounded-full bg-blue-900/30 flex-shrink-0" />
                    <div className="space-y-2">
                      <div className="h-8 w-32 bg-blue-900/20 rounded ml-auto" />
                    </div>
                  </div>
                </div>
                <Button onClick={onPublish} className="w-full bg-white text-black hover:bg-neutral-200">
                  Publish Chatflow
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function SubmissionsView({ onBack, onViewDetail }: { onBack: () => void; onViewDetail: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-neutral-400 hover:text-white -ml-2">
          <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
          Back to Chatflows
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-black overflow-hidden">
        {/* Hidden header on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          <div className="col-span-3">Submission ID</div>
          <div className="col-span-3">Date</div>
          <div className="col-span-4">Summary</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {[
          {
            id: "sub_892j2",
            date: "Oct 24, 2023 14:20",
            summary: "Claim for bumper damage on 2020 Honda Civic",
            status: "Processed",
          },
          {
            id: "sub_123k9",
            date: "Oct 24, 2023 11:05",
            summary: "Windshield crack reported on highway",
            status: "Pending",
          },
          {
            id: "sub_772m1",
            date: "Oct 23, 2023 09:15",
            summary: "Side mirror broken in parking lot",
            status: "Processed",
          },
          {
            id: "sub_445p8",
            date: "Oct 22, 2023 16:45",
            summary: "Rear-end collision at traffic light",
            status: "Review",
          },
        ].map((item, i) => (
          <div
            key={i}
            onClick={onViewDetail}
            className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 items-start md:items-center hover:bg-neutral-900 transition-colors border-b border-neutral-800 last:border-0 cursor-pointer group"
          >
            <div className="w-full md:w-auto md:col-span-3 flex justify-between md:block">
              <div className="font-mono text-sm text-neutral-300 group-hover:text-blue-400 transition-colors">
                {item.id}
              </div>
              <div className="md:hidden text-sm text-neutral-400">{item.date}</div>
            </div>

            <div className="hidden md:block col-span-3 text-sm text-neutral-400">{item.date}</div>

            <div className="w-full md:w-auto md:col-span-4 text-sm text-neutral-200 truncate">{item.summary}</div>

            <div className="w-full md:w-auto md:col-span-2 flex justify-between md:justify-end items-center">
              <span className="md:hidden text-xs text-neutral-500 uppercase">Status</span>
              <Badge
                variant="outline"
                className={`
                border-neutral-800 
                ${item.status === "Processed" ? "text-green-500 bg-green-500/10 border-green-500/20" : ""}
                ${item.status === "Pending" ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" : ""}
                ${item.status === "Review" ? "text-blue-500 bg-blue-500/10 border-blue-500/20" : ""}
              `}
              >
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SubmissionDetailView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-neutral-400 hover:text-white -ml-2">
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            Back
          </Button>
          <div className="hidden md:block h-4 w-px bg-neutral-800" />
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="h-4 w-4" />
            <span>Oct 24, 2023 14:20</span>
          </div>
          <Badge variant="outline" className="text-green-500 bg-green-500/10 border-green-500/20">
            Processed
          </Badge>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 md:flex-none border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 bg-transparent"
          >
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content - Summary & Insights */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="bg-black border-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">AI Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-300 leading-relaxed">
                The user is reporting a claim for a 2020 Honda Civic involving bumper damage. The incident occurred in a
                parking lot when another vehicle backed into the user's car. No injuries were reported. The user has
                provided photos of the rear bumper showing scratches and a dent.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black border-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Key Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Vehicle is drivable",
                  "Third party at fault (admitted)",
                  "Police report not filed (private property)",
                  "Estimated damage severity: Low to Medium",
                ].map((insight, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-300">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Raw Data */}
        <div className="space-y-6">
          <Card className="bg-black border-neutral-800 h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <List className="h-5 w-5 text-neutral-400" />
                <CardTitle className="text-lg">Raw Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Policy Number", value: "POL-99823112" },
                { label: "Incident Date", value: "2023-10-24" },
                { label: "Vehicle", value: "2020 Honda Civic" },
                { label: "Driver", value: "John Doe" },
                { label: "Location", value: "Walmart Parking Lot, Austin TX" },
                { label: "Photos", value: "3 images attached" },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm text-neutral-200 font-mono bg-neutral-900/50 p-2 rounded border border-neutral-800/50">
                    {item.value}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SuccessView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 text-center animate-in zoom-in-95 duration-500">
      <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
        <Check className="h-12 w-12 text-green-500" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl font-semibold tracking-tight">Chatflow Published!</h2>
        <p className="text-neutral-400">
          Your chatflow is now live and ready to accept submissions. You can manage it from the dashboard.
        </p>
      </div>

      <Card className="w-full max-w-md bg-neutral-950 border-neutral-800">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-neutral-900 flex items-center justify-center border border-neutral-800">
            <ExternalLink className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs text-neutral-500 font-medium uppercase">Public Link</div>
            <div className="text-sm text-neutral-300 font-mono truncate">https://iozen.ai/c/claim-bot-v1</div>
          </div>
          <Button variant="outline" size="sm" className="border-neutral-800 hover:bg-neutral-900 bg-transparent">
            Copy
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-neutral-800 hover:bg-neutral-900 text-neutral-300 bg-transparent"
        >
          Back to Dashboard
        </Button>
        <Button className="bg-white text-black hover:bg-neutral-200">
          <PlayCircle className="mr-2 h-4 w-4" />
          Test Chatflow
        </Button>
      </div>
    </div>
  )
}
