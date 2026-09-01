import React from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { FileText, Download, FileJson, Table, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activeProject } = useProject();

  if (!activeProject) {
    return <div className="text-xs text-[#A8A3B8]">Please select an active project scope.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Security Assessment Reports</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Export executive summaries, host inventories, and vulnerability intelligence in PDF, JSON, and CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* PDF Report Card */}
        <div className="cyber-panel p-6 flex flex-col justify-between hover:border-[#7C3AED] transition-all">
          <div>
            <div className="p-3 rounded-2xl bg-[#18142A] border border-[#282245] text-[#9B5CFF] w-fit mb-4 shadow-lg">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#F5F3FF] mb-1">Executive PDF Report</h3>
            <p className="text-xs text-[#A8A3B8] mb-4">
              Comprehensive multi-page audit report with executive risk summaries, host inventory tables, and remediation guidance.
            </p>
          </div>
          <a
            href={api.getReportPdfUrl(activeProject.id)}
            download
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download PDF</span>
          </a>
        </div>

        {/* JSON Dump Card */}
        <div className="cyber-panel p-6 flex flex-col justify-between hover:border-[#7C3AED] transition-all">
          <div>
            <div className="p-3 rounded-2xl bg-[#18142A] border border-[#282245] text-blue-400 w-fit mb-4 shadow-lg">
              <FileJson className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#F5F3FF] mb-1">Structured JSON Intelligence</h3>
            <p className="text-xs text-[#A8A3B8] mb-4">
              Machine-readable schema export containing normalized host objects, port states, raw script outputs, and CVE mappings.
            </p>
          </div>
          <a
            href={api.getReportJsonUrl(activeProject.id)}
            download
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#18142A] hover:bg-[#282245] text-[#F5F3FF] border border-[#282245] text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </a>
        </div>

        {/* Findings CSV */}
        <div className="cyber-panel p-6 flex flex-col justify-between hover:border-[#7C3AED] transition-all">
          <div>
            <div className="p-3 rounded-2xl bg-[#18142A] border border-[#282245] text-red-400 w-fit mb-4 shadow-lg">
              <Table className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#F5F3FF] mb-1">Findings Matrix (CSV)</h3>
            <p className="text-xs text-[#A8A3B8] mb-4">
              Spreadsheet of all correlated vulnerabilities, CVE references, CVSS ratings, and underlying scanner evidence.
            </p>
          </div>
          <a
            href={api.getReportFindingsCsvUrl(activeProject.id)}
            download
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#18142A] hover:bg-[#282245] text-[#F5F3FF] border border-[#282245] text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Findings CSV</span>
          </a>
        </div>

        {/* Hosts CSV */}
        <div className="cyber-panel p-6 flex flex-col justify-between hover:border-[#7C3AED] transition-all">
          <div>
            <div className="p-3 rounded-2xl bg-[#18142A] border border-[#282245] text-emerald-400 w-fit mb-4 shadow-lg">
              <Table className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#F5F3FF] mb-1">Host Inventory (CSV)</h3>
            <p className="text-xs text-[#A8A3B8] mb-4">
              Full table of discovered IP addresses, DNS hostnames, MAC vendors, operating systems, and calculated risk scores.
            </p>
          </div>
          <a
            href={api.getReportHostsCsvUrl(activeProject.id)}
            download
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#18142A] hover:bg-[#282245] text-[#F5F3FF] border border-[#282245] text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Hosts CSV</span>
          </a>
        </div>
      </div>
    </div>
  );
};
