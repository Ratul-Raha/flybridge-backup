"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfigTabs, type Tab } from "./shared/config-tabs";
import { PersonaTab } from "./persona-tab";
import { CapabilitiesTab } from "./capabilities-tab";
import { ToolsTab } from "./tools-tab";
import { RulesTab } from "./rules-tab";
import { ConversationsTab } from "./conversations-tab";
import { AuditTab } from "./audit-tab";

const TABS: Tab[] = [
  { id: "persona", label: "Persona" },
  { id: "capabilities", label: "Capabilities" },
  { id: "tools", label: "Tools" },
  { id: "rules", label: "Rules" },
  { id: "conversations", label: "Conversations" },
  { id: "audit", label: "Audit Log" },
];

export function BotConfigPanel() {
  const [activeTab, setActiveTab] = useState("persona");

  return (
    <div>
      <PageHeader
        title="Bot Configuration"
        subtitle="Configure your AI admin assistant's behavior, tools, and rules"
      />
      <ConfigTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === "persona" && <PersonaTab />}
        {activeTab === "capabilities" && <CapabilitiesTab />}
        {activeTab === "tools" && <ToolsTab />}
        {activeTab === "rules" && <RulesTab />}
        {activeTab === "conversations" && <ConversationsTab />}
        {activeTab === "audit" && <AuditTab />}
      </div>
    </div>
  );
}
