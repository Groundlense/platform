"use client";

import { useState, useMemo } from "react";
import {
  RiSettings4Line,
  RiRadarLine,
  RiCheckDoubleLine,
  RiFlaskLine,
  RiFileTextLine,
  RiAlertLine,
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiShieldCheckLine,
  RiImageLine,
  RiArrowRightUpLine,
  RiEdit2Line,
  RiUploadCloud2Line,
  RiLock2Line,
  RiUser3Line,
  RiUserAddLine,
  RiRefreshLine,
} from "react-icons/ri";
import { usePortalTab } from "./PortalContext";

interface PortalClientProps {
  project: any;
  projects: any[];
  boreholes: any[]; // Full report data: includes intervals[], waterTableObservations[], each interval has samples[] (with labResult), media[], soilDescriptions
  sites: any[];
  user: Record<string, unknown> | null;
  members: any[];        // Project members
  nablLabs: any[];       // NABL labs
  activityLogs: any[];   // Recent activity logs  
  projectDashboard: any; // Dashboard stats {boreholes, intervals, completedIntervals, completionPercentage, samples, media}
}

// Soil color mappings for SVG strata drawing
const SOIL_COLORS: Record<string, { fill: string; stroke: string; textColor: string }> = {
  fill: { fill: "#1A2E1A", stroke: "#2A4A2A", textColor: "#97C459" },
  topsoil: { fill: "#1A2E1A", stroke: "#2A4A2A", textColor: "#97C459" },
  silt: { fill: "#2A2010", stroke: "#4A3010", textColor: "#FAC775" },
  sand: { fill: "#201A08", stroke: "#3A2A10", textColor: "#FAC775" },
  clay: { fill: "#281818", stroke: "#482020", textColor: "#F0997B" },
  gravel: { fill: "#1A1A1A", stroke: "#3A3A3A", textColor: "#B4B2A9" },
  rock: { fill: "#151515", stroke: "#2E2E2E", textColor: "#E5E5E5" },
  default: { fill: "#1E1D1C", stroke: "#333333", textColor: "#6B6966" },
};

const BH_STATUS: Record<string, { cls: string; text: string }> = {
  PLANNED: { cls: "p-gr", text: "○ Planned" },
  IN_PROGRESS: { cls: "p-a", text: "● In progress" },
  COMPLETED: { cls: "p-g", text: "✓ Complete" },
  ABANDONED: { cls: "p-red", text: "✗ Abandoned" },
};

// Simple helper to match soil string to keys
function getSoilColors(soilDesc: string) {
  const desc = (soilDesc || "").toLowerCase();
  if (desc.includes("fill") || desc.includes("topsoil")) return SOIL_COLORS.fill;
  if (desc.includes("silt")) return SOIL_COLORS.silt;
  if (desc.includes("sand")) return SOIL_COLORS.sand;
  if (desc.includes("clay")) return SOIL_COLORS.clay;
  if (desc.includes("gravel")) return SOIL_COLORS.gravel;
  if (desc.includes("rock") || desc.includes("stone")) return SOIL_COLORS.rock;
  return SOIL_COLORS.default;
}

export default function PortalClient({
  project,
  projects = [],
  boreholes = [],
  sites = [],
  user = null,
  members = [],
  nablLabs = [],
  activityLogs = [],
  projectDashboard = null,
}: PortalClientProps) {
  // Tab control context hook
  const { activeTab, setActiveTab } = usePortalTab();

  // Active Project Fallbacks
  const proj = useMemo(() => {
    return project || {
      id: "GL-PRJ-0047",
      projectCode: "GL-PRJ-0047",
      name: "Patna-Gaya Dobhi Road Project (NH-83)",
      state: "Bihar",
      startDate: "2025-04-12",
      endDate: "2025-05-15",
      initiatedByCompany: { name: "NHAI — National Highways Authority of India" },
      epcOrganization: { name: "GR Infraprojects Limited", code: "GR-INFRA" },
      billingCompany: { name: "STUP Consultants Pvt Ltd" }
    };
  }, [project]);

  // Project Members Fallbacks
  const projectMembers = useMemo(() => {
    if (members && members.length > 0) return members;
    return [
      { id: "GL-W-0042", name: "Ramesh Chandra", role: "Field Supervisor", qual: "Diploma Civil", status: "On site", team: "Team A" },
      { id: "GL-D-0019", name: "Mohan Prasad", role: "Driller", qual: "8 yrs exp", status: "On site", team: "Team A" },
      { id: "GL-W-0067", name: "Suresh Kumar", role: "Field Supervisor", qual: "ITI", status: "Standby", team: "Team B" },
      { id: "GL-D-0024", name: "Ram Swaroop", role: "Driller", qual: "5 yrs exp", status: "Standby", team: "Team B" },
      { id: "GL-ENG-0142", name: "Er. Rajesh Kumar", role: "Geotech Engineer", qual: "M.Tech · Lic CEB/2018", status: "Active", team: "Engineer + Lab" },
      { id: "GL-L-0008", name: "Amit Verma", role: "Lab Technician", qual: "NABL CC-1847", status: "Lab", team: "Engineer + Lab" }
    ];
  }, [members]);

  // NABL Lab Fallbacks
  const activeNablLab = useMemo(() => {
    if (nablLabs && nablLabs.length > 0) return nablLabs[0];
    return { name: "Geocon Labs", code: "CC-1847", validUntil: "Dec 2026" };
  }, [nablLabs]);

  // Mapped Boreholes combining DB and fallbacks
  const mappedBoreholes = useMemo(() => {
    const parseNum = (val: any, fallback: number) => {
      if (val === null || val === undefined) return fallback;
      const n = parseFloat(val);
      return isNaN(n) ? fallback : n;
    };

    if (!boreholes || boreholes.length === 0) {
      return [
        {
          id: "bh01",
          boreholeCode: "GL-BH-0047-A-01",
          name: "Abutment A (A-1)",
          structureType: "VUP",
          chainage: "134+550",
          span: "1x20",
          team: "Team A",
          latitude: "521847.00",
          longitude: "3148203.00",
          groundLevelRL: 100.00,
          plannedDepth: 30.0,
          finalDepth: 30.0,
          status: "COMPLETED",
          startedAt: "2026-04-12T08:30:00Z",
          completedAt: "2026-04-12T16:22:00Z",
          waterTable: 6.20,
          intervals: [
            { id: "i11", intervalNo: 1, fromDepth: 0.0, toDepth: 2.0, soilDescription: "Fill/Topsoil", blow1: 2, blow2: 3, blow3: 3, nValue: 8, nCorrected: 8, isCompleted: true },
            { id: "i12", intervalNo: 2, fromDepth: 2.0, toDepth: 6.0, soilDescription: "Sandy silt", blow1: 3, blow2: 5, blow3: 5, nValue: 13, nCorrected: 13, isCompleted: true },
            { id: "i13", intervalNo: 3, fromDepth: 6.0, toDepth: 9.0, soilDescription: "Clay, stiff", blow1: 4, blow2: 5, blow3: 5, nValue: 10, nCorrected: 10, isCompleted: true },
            { id: "i14", intervalNo: 4, fromDepth: 9.0, toDepth: 16.0, soilDescription: "Dense sand", blow1: 8, blow2: 13, blow3: 14, nValue: 27, nCorrected: 24, isCompleted: true },
            { id: "i15", intervalNo: 5, fromDepth: 16.0, toDepth: 30.0, soilDescription: "Hard rock", blow1: 50, blow2: 50, blow3: 50, nValue: 150, nCorrected: 150, isCompleted: true }
          ],
          waterTableObservations: [{ depth: 6.20, observedAt: "2026-04-12T12:00:00Z" }],
          media: [
            { id: "m11", fileName: "rig_setup.jpg", photoType: "RIG_SETUP" },
            { id: "m12", fileName: "corebox1.jpg", photoType: "CORE_BOX" }
          ]
        },
        {
          id: "bh02",
          boreholeCode: "GL-BH-0047-A-02",
          name: "Abutment A (A-2)",
          structureType: "VUP",
          chainage: "134+550",
          span: "1x20",
          team: "Team A",
          latitude: "521850.66",
          longitude: "3148197.82",
          groundLevelRL: 100.00,
          plannedDepth: 30.0,
          finalDepth: 30.0,
          status: "COMPLETED",
          startedAt: "2026-04-13T09:00:00Z",
          completedAt: "2026-04-13T17:10:00Z",
          waterTable: 6.50,
          intervals: [
            { id: "i21", intervalNo: 1, fromDepth: 0.0, toDepth: 1.5, soilDescription: "Topsoil", blow1: 3, blow2: 3, blow3: 4, nValue: 7, nCorrected: 6, isCompleted: true },
            { id: "i22", intervalNo: 2, fromDepth: 1.5, toDepth: 3.0, soilDescription: "Sandy silt", blow1: 4, blow2: 5, blow3: 5, nValue: 10, nCorrected: 9, isCompleted: true },
            { id: "i23", intervalNo: 3, fromDepth: 3.0, toDepth: 6.0, soilDescription: "Clayey silt", blow1: 5, blow2: 6, blow3: 6, nValue: 12, nCorrected: 11, isCompleted: true }
          ],
          waterTableObservations: [{ depth: 6.50, observedAt: "2026-04-13T13:00:00Z" }],
          media: [{ id: "m21", fileName: "rig2.jpg", photoType: "RIG_SETUP" }]
        },
        {
          id: "bh03",
          boreholeCode: "GL-BH-0047-A-03",
          name: "Pier P1",
          structureType: "ROB",
          chainage: "142+545",
          span: "3x30",
          team: "Team A",
          latitude: "521978.00",
          longitude: "3148194.00",
          groundLevelRL: 197.60,
          plannedDepth: 20.0,
          finalDepth: 20.0,
          status: "COMPLETED",
          startedAt: "2026-04-15T09:14:00Z",
          completedAt: "2026-04-15T16:45:00Z",
          waterTable: 6.20,
          intervals: [
            { id: "i31", intervalNo: 1, fromDepth: 0.0, toDepth: 2.0, soilDescription: "Topsoil", blow1: 3, blow2: 4, blow3: 4, nValue: 8, nCorrected: 7, isCompleted: true },
            { id: "i32", intervalNo: 2, fromDepth: 2.0, toDepth: 6.0, soilDescription: "Sandy silt", blow1: 3, blow2: 5, blow3: 5, nValue: 13, nCorrected: 13, isCompleted: true },
            { id: "i33", intervalNo: 3, fromDepth: 6.0, toDepth: 7.5, soilDescription: "Clay, stiff", blow1: 4, blow2: 5, blow3: 5, nValue: 10, nCorrected: 9, isCompleted: true },
            { id: "i34", intervalNo: 4, fromDepth: 7.5, toDepth: 9.0, soilDescription: "Clay (Disturbed)", blow1: 14, blow2: 16, blow3: 12, nValue: 42, nCorrected: 38, isCompleted: true },
            { id: "i35", intervalNo: 5, fromDepth: 9.0, toDepth: 20.0, soilDescription: "Dense sand", blow1: 8, blow2: 13, blow3: 14, nValue: 27, nCorrected: 24, isCompleted: true }
          ],
          waterTableObservations: [{ depth: 6.20, observedAt: "2026-04-15T12:00:00Z" }],
          media: [
            { id: "m31", fileName: "rig3.jpg", photoType: "RIG_SETUP" },
            { id: "m32", fileName: "corebox3.jpg", photoType: "CORE_BOX" },
            { id: "m33", fileName: "spt_sample.jpg", photoType: "SAMPLE_SPLIT_SPOON" }
          ]
        },
        {
          id: "bh04",
          boreholeCode: "GL-BH-0047-B-01",
          name: "Pier P2",
          structureType: "ROB",
          chainage: "142+570",
          span: "3x30",
          team: "Team B",
          latitude: "522044.00",
          longitude: "3148191.00",
          groundLevelRL: 197.55,
          plannedDepth: 18.0,
          finalDepth: 12.0,
          status: "IN_PROGRESS",
          startedAt: "2026-04-15T10:15:00Z",
          completedAt: null,
          waterTable: 6.80,
          intervals: [
            { id: "i41", intervalNo: 1, fromDepth: 0.0, toDepth: 1.5, soilDescription: "Topsoil", blow1: 2, blow2: 3, blow3: 3, nValue: 8, nCorrected: 8, isCompleted: true },
            { id: "i42", intervalNo: 2, fromDepth: 1.5, toDepth: 6.0, soilDescription: "Clayey silt", blow1: 4, blow2: 5, blow3: 5, nValue: 13, nCorrected: 13, isCompleted: true },
            { id: "i43", intervalNo: 3, fromDepth: 6.0, toDepth: 12.0, soilDescription: "Sandy clay", blow1: 5, blow2: 6, blow3: 6, nValue: 10, nCorrected: 9, isCompleted: true }
          ],
          waterTableObservations: [{ depth: 6.80, observedAt: "2026-04-15T14:30:00Z" }],
          media: [{ id: "m41", fileName: "rig4.jpg", photoType: "RIG_SETUP" }]
        },
        {
          id: "bh05",
          boreholeCode: "GL-BH-0047-B-02",
          name: "Abutment B",
          structureType: "VUP",
          chainage: "142+595",
          span: "1x20",
          team: "Team B",
          latitude: "522110.00",
          longitude: "3148188.00",
          groundLevelRL: 197.60,
          plannedDepth: 18.0,
          finalDepth: 0.0,
          status: "PLANNED",
          startedAt: null,
          completedAt: null,
          waterTable: null,
          intervals: [],
          waterTableObservations: [],
          media: []
        }
      ];
    }

    // Merge database items with structured details
    return boreholes.map((bh, idx) => {
      const isTeamB = bh.boreholeCode?.includes("-B-") || idx >= 3;
      const defaultName = idx === 0 ? "Abutment A (A-1)" : idx === 1 ? "Abutment A (A-2)" : idx === 2 ? "Pier P1" : idx === 3 ? "Pier P2" : "Abutment B";
      const defaultStruct = idx % 2 === 0 ? "VUP" : "ROB";
      const defaultChain = idx === 0 || idx === 1 ? "134+550" : idx === 2 ? "142+545" : idx === 3 ? "142+570" : "142+595";
      const defaultSpan = idx % 2 === 0 ? "1x20" : "3x30";
      const defaultLat = idx === 0 ? "521847.00" : idx === 1 ? "521850.66" : idx === 2 ? "521978.00" : idx === 3 ? "522044.00" : "522110.00";
      const defaultLng = idx === 0 ? "3148203.00" : idx === 1 ? "3148197.82" : idx === 2 ? "3148194.00" : idx === 3 ? "3148191.00" : "3148188.00";
      const defaultRL = idx < 2 ? 100.00 : 197.60;
      const defaultPlanned = idx < 2 ? 30.0 : 18.0;
      const defaultWT = idx === 3 ? 6.80 : 6.20;

      const rawIntervals = bh.intervals || [];
      const intervals = rawIntervals.map((inv: any) => ({
        ...inv,
        fromDepth: parseNum(inv.fromDepth, 0),
        toDepth: parseNum(inv.toDepth, 0),
        nValue: parseNum(inv.nValue, 0),
        nCorrected: parseNum(inv.nCorrected, 0),
      }));

      const waterTable = parseNum(bh.waterTableObservations?.[0]?.depth, defaultWT);

      return {
        ...bh,
        name: bh.name || defaultName,
        structureType: bh.structureType || defaultStruct,
        chainage: bh.chainage || defaultChain,
        span: bh.span || defaultSpan,
        team: bh.team?.name || (isTeamB ? "Team B" : "Team A"),
        latitude: bh.latitude || defaultLat,
        longitude: bh.longitude || defaultLng,
        groundLevelRL: parseNum(bh.groundLevelRL, defaultRL),
        plannedDepth: parseNum(bh.plannedDepth, defaultPlanned),
        finalDepth: parseNum(bh.finalDepth, bh.status === "COMPLETED" ? defaultPlanned : bh.status === "IN_PROGRESS" ? 12.0 : 0.0),
        waterTable,
        intervals: intervals.length > 0 ? intervals : [
          { id: `i_${bh.id}_1`, intervalNo: 1, fromDepth: 0.0, toDepth: 2.0, soilDescription: "Fill/Topsoil", blow1: 2, blow2: 3, blow3: 3, nValue: 8, nCorrected: 8, isCompleted: true },
          { id: `i_${bh.id}_2`, intervalNo: 2, fromDepth: 2.0, toDepth: 6.0, soilDescription: "Sandy silt", blow1: 3, blow2: 5, blow3: 5, nValue: 13, nCorrected: 13, isCompleted: true },
          { id: `i_${bh.id}_3`, intervalNo: 3, fromDepth: 6.0, toDepth: 9.0, soilDescription: "Clay, stiff", blow1: 4, blow2: 5, blow3: 5, nValue: 10, nCorrected: 10, isCompleted: true },
          { id: `i_${bh.id}_4`, intervalNo: 4, fromDepth: 9.0, toDepth: 16.0, soilDescription: "Dense sand", blow1: 8, blow2: 13, blow3: 14, nValue: 27, nCorrected: 24, isCompleted: true }
        ],
        waterTableObservations: bh.waterTableObservations || [{ depth: defaultWT, observedAt: new Date().toISOString() }],
        media: bh.media || [{ id: `med_${bh.id}`, fileName: "rig_setup.jpg", photoType: "RIG_SETUP" }]
      };
    });
  }, [boreholes]);

  // Tab stats counters
  const stats = useMemo(() => {
    const total = mappedBoreholes.length;
    const completed = mappedBoreholes.filter(b => b.status === "COMPLETED").length;
    const active = mappedBoreholes.filter(b => b.status === "IN_PROGRESS").length;
    const pending = mappedBoreholes.filter(b => b.status === "PLANNED").length;
    return { total, completed, active, pending };
  }, [mappedBoreholes]);

  // Recent logs
  const logs = useMemo(() => {
    if (activityLogs && activityLogs.length > 0) return activityLogs;
    return [
      { id: "log1", action: "SPT SUBMITTED", entityType: "BOREHOLE", entityId: "GL-BH-0047-B-01", detail: "SPT at 12.0m — N=27 (Corrected N=24)", createdAt: "2026-06-08T10:25:00Z", user: { firstName: "Ramesh", lastName: "Chandra" } },
      { id: "log2", action: "WATER TABLE MEASURED", entityType: "BOREHOLE", entityId: "GL-BH-0047-B-01", detail: "Water table observed at 6.80m depth", createdAt: "2026-06-08T10:07:00Z", user: { firstName: "Ramesh", lastName: "Chandra" } },
      { id: "log3", action: "ANOMALY FLAGGED", entityType: "BOREHOLE", entityId: "GL-BH-0047-A-03", detail: "N=42 at 8.5m flagged by system: 250% jump", createdAt: "2026-06-08T05:12:00Z", user: { firstName: "System", lastName: "Engine" } }
    ];
  }, [activityLogs]);

  // Tab 2: Live Monitor states
  const [selectedBhCode, setSelectedBhCode] = useState<string>("GL-BH-0047-A-03");
  const [monitorAnomalies, setMonitorAnomalies] = useState({
    bh03Anomaly: true,
    bh03Gps: true,
  });

  const selectedBorehole = useMemo(() => {
    return mappedBoreholes.find(b => b.boreholeCode === selectedBhCode) || mappedBoreholes[0];
  }, [selectedBhCode, mappedBoreholes]);

  // Tab 3: Review states
  const [expandedBhId, setExpandedBhId] = useState<string | null>("bh03");
  const [bhStatusApproved, setBhStatusApproved] = useState<Record<string, boolean>>({
    bh01: true,
    bh02: false,
    bh03: false,
    bh04: false,
  });
  const [correctedNValue, setCorrectedNValue] = useState<number>(18);
  const [reviewApplied, setReviewApplied] = useState(false);
  const [selectedClause, setSelectedClause] = useState("IS 2131 Cl.6.3 — Casing disturbance");

  // Tab 4: Lab states
  const [selectedSampleId, setSelectedSampleId] = useState("GL-BH03-4.5-S1");
  const [gSiltClay, setGSiltClay] = useState<number>(58.7);
  const [gFineSand, setGFineSand] = useState<number>(29.5);
  const [gMedSand, setGMedSand] = useState<number>(6.9);
  const [gCoarseSand, setGCoarseSand] = useState<number>(4.9);
  const [gGravel, setGGravel] = useState<number>(0.0);

  const [liquidLimit, setLiquidLimit] = useState<number>(35);
  const [plasticLimit, setPlasticLimit] = useState<number>(21);

  const [bulkDensity, setBulkDensity] = useState<number>(1.83);
  const [moistureContent, setMoistureContent] = useState<number>(13.5);
  const [specificGravity, setSpecificGravity] = useState<number>(2.66);

  // Shear Strength
  const [uuC, setUuC] = useState<number>(0.42);
  const [uuPhi, setUuPhi] = useState<number>(7);
  const [cuC, setCuC] = useState<number>(0.18);
  const [cuPhi, setCuPhi] = useState<number>(23);
  const [cdC, setCdC] = useState<number>(0.00);
  const [cdPhi, setCdPhi] = useState<number>(29);

  // Consolidation (Step 5)
  const [cc, setCc] = useState<number>(0.25);
  const [cv, setCv] = useState<number>(1.8e-3);
  const [mv, setMv] = useState<number>(2.2e-4);
  const [pc, setPc] = useState<number>(1.5);

  // Rock (Step 6)
  const [ucs, setUcs] = useState<number>(45);
  const [pointLoad, setPointLoad] = useState<number>(2.4);
  const [rockClass, setRockClass] = useState<string>("Moderately strong Sandstone");

  // Chemical (Step 7)
  const [ph, setPh] = useState<number>(7.4);
  const [sulphates, setSulphates] = useState<number>(0.12);
  const [chlorides, setChlorides] = useState<number>(0.05);
  const [organic, setOrganic] = useState<number>(0.8);

  const [labSaved, setLabSaved] = useState(false);

  // Auto-calculated Atterberg limits
  const plasticityIndex = useMemo(() => {
    const val = liquidLimit - plasticLimit;
    return val > 0 ? val : 0;
  }, [liquidLimit, plasticLimit]);

  const isPlastic = plasticityIndex > 0;

  const uscsSymbol = useMemo(() => {
    if (gSiltClay < 50) {
      return "SP — Poorly graded sand";
    } else {
      if (liquidLimit < 35) {
        return plasticityIndex > 7 ? "CL — Low plasticity clay" : "ML — Silt / Low plasticity";
      } else if (liquidLimit < 50) {
        return plasticityIndex > 10 ? "CI — Medium plasticity clay" : "MI — Silt / Med plasticity";
      } else {
        return plasticityIndex > 17 ? "CH — High plasticity clay" : "MH — Silt / High plasticity";
      }
    }
  }, [gSiltClay, liquidLimit, plasticityIndex]);

  // Density & physical properties calculations
  const dryDensity = useMemo(() => {
    if (moistureContent <= -100) return 0;
    const val = bulkDensity / (1 + moistureContent / 100);
    return isNaN(val) ? 0 : parseFloat(val.toFixed(2));
  }, [bulkDensity, moistureContent]);

  const voidRatio = useMemo(() => {
    if (dryDensity <= 0) return 0;
    const val = (specificGravity * 1.0) / dryDensity - 1;
    return isNaN(val) ? 0 : parseFloat(val.toFixed(2));
  }, [specificGravity, dryDensity]);

  const porosity = useMemo(() => {
    const val = (voidRatio / (1 + voidRatio)) * 100;
    return isNaN(val) ? 0 : parseFloat(val.toFixed(1));
  }, [voidRatio]);

  // Tab 5: Report states
  const [allowableSettlement, setAllowableSettlement] = useState<number>(25);
  const [rigidityFactor, setRigidityFactor] = useState<number>(0.80);
  const [shearFailureMode, setShearFailureMode] = useState("General shear failure");
  
  const [seismicZone, setSeismicZone] = useState("Zone III");
  const [pga, setPga] = useState<number>(0.16);
  const [earthquakeMag, setEarthquakeMag] = useState<number>(7.5);
  
  const [selectedReportBh, setSelectedReportBh] = useState<string>("GL-BH-0047-A-01");
  const [tamperCertGenerated, setTamperCertGenerated] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showExcelSec, setShowExcelSec] = useState(false);

  // Liquefaction Table Data calculation
  const liquefactionData = useMemo(() => {
    const bh = mappedBoreholes.find(b => b.boreholeCode === selectedReportBh) || mappedBoreholes[0];
    return bh.intervals.map((item: any, idx: number) => {
      // CSR calculation: simple model based on depth, PGA
      const depth = (item.fromDepth + item.toDepth) / 2;
      const rd = 1.0 - 0.00765 * depth; // depth reduction factor
      const csr = 0.65 * pga * (1.0 / 1.0) * rd; // simplified CSR
      
      // CRR calculation: based on corrected N
      const n160 = item.nCorrected || item.nValue;
      let crr = 0.0;
      if (n160 < 30) {
        const x = n160 / 135;
        const y = n160 / 13.5;
        crr = 1.0 / (34.0 - n160) + n160 / 135.0 - 50.0 / (10.0 * n160 + 45.0) * (10.0 * n160 + 45.0) + 0.0075; // simple curve fit
        // Safe bounding
        crr = 0.05 + 0.012 * n160 + 0.0003 * Math.pow(n160, 2);
      } else {
        crr = 0.5;
      }
      
      const fs = crr / csr;
      const status = fs < 1.0 ? "Liquefiable" : "Safe";
      
      return {
        depth: `${item.fromDepth.toFixed(2)}-${item.toDepth.toFixed(2)}m`,
        rawN: item.nValue,
        n160: n160.toFixed(1),
        csr: csr.toFixed(3),
        crr: crr.toFixed(3),
        fs: fs.toFixed(2),
        status
      };
    });
  }, [selectedReportBh, pga, mappedBoreholes]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-base">
      <style dangerouslySetInnerHTML={{ __html: `
        /* ══ CUSTOM LABELS & TEXTS ══ */
        .card { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 9px; padding: 14px; margin-bottom: 12px; }
        .card-title { font-size: 10px; font-weight: 600; color: var(--color-text-ter); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 5px; display: flex; align-items: center; justify-content: space-between; }
        .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
        .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
        .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; }
        .fg { display: flex; flex-direction: column; gap: 4px; }
        .fl { font-size: 9px; font-weight: 600; color: var(--color-text-ter); }
        .fi { font-size: 11px; padding: 6px 10px; border: 1.5px solid var(--color-border-mid); border-radius: 7px; background: var(--color-bg-card); color: var(--color-text-pri); outline: none; }
        .fi:focus { border-color: var(--color-rust-mid); }
        .fs { font-size: 11px; padding: 6px 10px; border: 1.5px solid var(--color-border-mid); border-radius: 7px; background: var(--color-bg-card); color: var(--color-text-pri); outline: none; }
        .ib { border-radius: 7px; padding: 7px 11px; font-size: 10px; line-height: 1.5; margin-bottom: 12px; }
        
        /* DARK HSL MAP ALIGNMENT */
        .ib-r { background: rgba(163,45,45,.08); border: 0.5px solid rgba(163,45,45,.25); color: #F09595; }
        .ib-a { background: rgba(186,117,23,.08); border: 0.5px solid rgba(186,117,23,.25); color: #FAC775; }
        .ib-b { background: rgba(24,95,165,.08); border: 0.5px solid rgba(24,95,165,.25); color: #85B7EB; }
        .ib-g { background: rgba(59,109,17,.08); border: 0.5px solid rgba(59,109,17,.25); color: #97C459; }
        
        .ct-lock { font-size: 9px; color: var(--color-amber-d); background: rgba(186,117,23,.12); padding: 2px 6px; border-radius: 3px; font-weight: 500; text-transform: none; }
        .ct-action { font-size: 9px; color: var(--color-rust-d); cursor: pointer; text-transform: none; font-weight: 500; }
        .nabl-b { font-size: 9px; color: #97C459; background: rgba(59,109,17,.08); border-radius: 5px; padding: 6px 10px; border: 0.5px solid rgba(59,109,17,.25); display: inline-block; font-weight: 500; }
        .dr { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; border-bottom: 0.5px solid var(--color-border); }
        .dr:last-child { border-bottom: none; }
        .dr-l { color: var(--color-text-ter); }
        .dr-v { color: var(--color-text-sec); font-weight: 500; }
        .dr-v.ok { color: var(--color-green-d); }
        .dr-v.warn { color: var(--color-amber-d); }

        /* LIVE MONITOR TAB styles */
        .bore-viewer { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
        .bv-header { background: var(--color-bg-surface); padding: 8px 12px; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; }
        .bv-select { font-size: 11px; padding: 4px 8px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--color-bg-card); color: var(--color-text-pri); outline: none; margin-left: 8px; }
        .bv-body { display: grid; grid-template-columns: 1fr 320px; border-top: 1px solid var(--color-border); }
        .bv-3d { background: #1A1918; padding: 12px; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; align-items: center; }
        .bv-right { padding: 12px 14px; background: var(--color-bg-surface); display: flex; flex-direction: column; gap: 4px; }
        .bv-right-title { font-size: 11px; font-weight: 600; color: var(--color-text-pri); margin-bottom: 6px; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 5px; }
        .photo-thumb { background: var(--color-bg-card); border: 0.5px solid var(--color-border); border-radius: 4px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .photo-thumb:hover { border-color: var(--color-rust-mid); }
        .pt-icon { font-size: 14px; margin-bottom: 2px; }
        .pt-label { font-size: 8px; color: var(--color-text-ter); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .anom-card { background: rgba(163,45,45,.03); border: 1.5px dashed rgba(163,45,45,.2); border-radius: 9px; padding: 10px 12px; margin-bottom: 10px; }
        .anom-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .anom-title { font-size: 11px; font-weight: 600; color: #F09595; }
        .anom-body { font-size: 10px; color: var(--color-text-sec); line-height: 1.5; margin-bottom: 8px; }
        .anom-actions { display: flex; gap: 6px; }
        .btn { font-size: 10px; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-weight: 500; transition: all 0.1s; border: none; }
        .btn-sm { font-size: 9px; padding: 4px 8px; }
        
        .btn-p { background: var(--color-rust-mid); color: #fff; }
        .btn-p:hover { background: var(--color-rust-d); }
        .btn-d { background: rgba(163,45,45,.15); color: #F09595; border: 0.5px solid rgba(163,45,45,.3); }
        .btn-d:hover { background: rgba(163,45,45,.25); }
        .btn-w { background: var(--color-bg-card); color: var(--color-text-sec); border: 0.5px solid var(--color-border-mid); }
        .btn-w:hover { border-color: var(--color-rust-mid); }
        .btn-s { background: rgba(59,109,17,.15); color: #97C459; border: 0.5px solid rgba(59,109,17,.3); }
        .btn-s:hover { background: rgba(59,109,17,.25); }
        .btn-b { background: rgba(24,95,165,.15); color: #85B7EB; border: 0.5px solid rgba(24,95,165,.3); }
        .btn-b:hover { background: rgba(24,95,165,.25); }
        
        .feed-item { display: flex; gap: 10px; padding: 8px 4px; border-bottom: 0.5px solid var(--color-border); font-size: 11px; align-items: flex-start; }
        .feed-item:last-child { border-bottom: none; }
        .fdot { width: 6px; height: 6px; rounded: 9999px; margin-top: 4px; flex-shrink: 0; border-radius: 50%; }
        .fd-g { background: var(--color-green-d); }
        .fd-a { background: var(--color-amber-d); }
        .fd-r { background: var(--color-rust-d); }
        .fd-red { background: #A32D2D; }
        .fc { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .ft { color: var(--color-text-pri); font-weight: 500; }
        .fs2 { color: var(--color-text-ter); font-size: 10px; }
        .ftime { font-size: 9px; color: var(--color-text-ter); white-space: nowrap; }

        /* REVIEW TAB styles */
        .brh { display: flex; align-items: center; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 7px; padding: 10px 12px; margin-bottom: 6px; cursor: pointer; }
        .brh.flagged { border-color: rgba(163,45,45,.3); }
        .brh:hover { border-color: var(--color-border-mid); }
        .brh-id { font-family: 'DM Mono', monospace; font-size: 8px; color: var(--color-amber-d); margin-bottom: 1px; }
        .brh-name { font-size: 12px; font-weight: 600; color: var(--color-text-pri); }
        .brh-meta { font-size: 9px; color: var(--color-text-ter); margin-top: 2px; }
        .brh-chevron { font-size: 11px; color: var(--color-text-ter); margin-left: 8px; transform: rotate(0deg); transition: transform 0.2s; }
        .brh-chevron.open { transform: rotate(180deg); }
        .spt-tbl { width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px; }
        .spt-tbl th { background: var(--color-bg-surface); color: var(--color-text-ter); text-transform: uppercase; font-size: 8px; font-weight: 600; letter-spacing: 0.4px; padding: 5px 8px; text-align: left; border-bottom: 1px solid var(--color-border); }
        .spt-tbl td { padding: 6px 8px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text-sec); }
        .spt-tbl tr.flagged td { background: rgba(163,45,45,.03); color: #F09595; }
        .nv { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--color-text-pri); }
        .nv-flag { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: bold; color: #F09595; }
        .mod-panel { background: var(--color-bg-raised); border: 1px solid var(--color-border-mid); border-radius: 8px; padding: 12px; margin-top: 10px; }
        .mod-title { font-size: 10px; font-weight: 600; color: var(--color-text-sec); text-transform: uppercase; margin-bottom: 8px; border-bottom: 0.5px solid var(--color-border-mid); padding-bottom: 4px; }
        .mod-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .mod-orig { font-size: 11px; font-weight: 500; color: var(--color-text-ter); }
        .mod-new { font-size: 11px; font-weight: 700; color: var(--color-green-d); }
        .btn-row { display: flex; gap: 6px; margin-top: 8px; }

        /* LAB TAB styles */
        .sl { font-size: 9px; font-weight: 600; color: var(--color-rust-d); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 14px; margin-bottom: 6px; }
        .excel-zone { border: 1.5px dashed var(--color-border-mid); border-radius: 7px; padding: 14px; text-align: center; cursor: pointer; background: var(--color-bg-raised); }
        .excel-zone:hover { border-color: var(--color-rust-mid); }
        .excel-icon { font-size: 20px; margin-bottom: 4px; color: var(--color-text-ter); }
        .excel-text { font-size: 11px; font-weight: 500; color: var(--color-text-sec); }
        .excel-sub { font-size: 9px; color: var(--color-text-ter); margin-top: 2px; }

        /* MAP WRAP */
        .map-wrap { height: 160px; background: #252423; border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 12px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .map-bg2 { position: absolute; inset: 0; opacity: 0.15; background-image: radial-gradient(#F0997B 1px, transparent 1px), radial-gradient(#F0997B 1px, transparent 1px); background-size: 20px 20px; background-position: 0 0, 10px 10px; }
        .map-grid2 { position: absolute; inset: 0; opacity: 0.05; background: linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px); background-size: 40px 40px; }
        .mp { position: absolute; cursor: pointer; display: flex; align-items: center; font-size: 12px; }
        .mp-lbl { font-size: 8px; font-family: 'DM Mono', monospace; font-weight: 700; background: var(--color-bg-surface); padding: 1px 4px; border: 0.5px solid var(--color-border-mid); border-radius: 3px; margin-left: 2px; white-space: nowrap; }

        /* TABLE styles */
        .dt { width: 100%; border-collapse: collapse; font-size: 11px; }
        .dt th { background: var(--color-bg-surface); padding: 6px 8px; text-align: left; text-transform: uppercase; font-size: 8px; font-weight: 600; color: var(--color-text-ter); border-bottom: 1px solid var(--color-border); }
        .dt td { padding: 6px 8px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text-sec); }
        .td-p { font-weight: 600; color: var(--color-text-pri) !important; }

        /* REPORT PREVIEW */
        .report-preview-box { background: #FFFFFF; color: #1E1D1C; border-radius: 8px; padding: 24px; font-family: 'Outfit', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.15); margin-top: 12px; border: 1px solid #E5E5E5; }
        .rp-header { border-bottom: 2px solid #1A1918; padding-bottom: 12px; margin-bottom: 16px; text-align: center; }
        .rp-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; text-transform: uppercase; color: #1A1918; }
        .rp-subtitle { font-size: 10px; font-family: 'DM Mono', monospace; color: #6B6966; margin-top: 4px; }
        .rp-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
        .rp-table th { background: #F4F4F4; color: #1A1918; font-weight: 700; border: 1px solid #D5D5D5; padding: 6px; text-align: left; text-transform: uppercase; font-size: 8px; }
        .rp-table td { border: 1px solid #D5D5D5; padding: 6px; color: #333332; }

        /* TAMPER CERTIFICATE */
        .rp-cert { background: rgba(59,109,17,.05); border: 1px solid rgba(59,109,17,.2); border-radius: 8px; padding: 12px; margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
        .rp-cert-t { font-size: 10px; font-weight: 700; color: #97C459; }
        .rp-cert-h { font-size: 8px; font-family: 'DM Mono', monospace; color: var(--color-text-ter); }
      ` }} />

      {/* Internal Interactive Tab Bar */}
      <div className="flex items-center bg-bg-surface border-b border-border shrink-0 select-none" style={{ padding: "0 16px" }}>
        {[
          { key: "setup", label: "Setup", icon: <RiSettings4Line /> },
          { key: "monitor", label: "Live Monitor", icon: <RiRadarLine /> },
          { key: "review", label: "Review", icon: <RiCheckDoubleLine /> },
          { key: "lab", label: "Lab", icon: <RiFlaskLine /> },
          { key: "report", label: "Report", icon: <RiFileTextLine /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-[6px] whitespace-nowrap bg-transparent border-x-0 border-t-0 transition-all duration-100 cursor-pointer
              ${activeTab === t.key
                ? "text-rust-d border-b-2 border-rust-mid font-semibold"
                : "text-text-ter border-b-2 border-transparent hover:text-text-sec"
              }`}
            style={{ padding: "12px 14px", fontSize: "11px", fontWeight: 500 }}
          >
            <span className="text-[12px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents Content Wrapper */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ⚙ SETUP TAB */}
        {activeTab === "setup" && (
          <div className="animate-fade-in">
            <div className="ib ib-r shadow-sm">
              ⚠ Once the first SPT entry is submitted by a field worker, all setup data becomes read-only and cannot be modified by anyone — including the engineer. Ensure all parameters are correct before field work begins.
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-rust-mid p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Total borings</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.total}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">Planned</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-green-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Completed</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.completed}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-amber-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">In progress</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.active}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">Active now</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-blue-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Pending</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.pending}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">Not started</div>
              </div>
            </div>

            {/* Project Details Card */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>📋 Project Details</span>
                <span className="ct-action">Edit</span>
              </div>
              <div className="grid2">
                <div className="fg">
                  <div className="fl">Project ID</div>
                  <input className="fi font-mono text-amber-d" value={proj.projectCode} readOnly />
                </div>
                <div className="fg">
                  <div className="fl">Project Name</div>
                  <input className="fi" defaultValue={proj.name} />
                </div>
                <div className="fg">
                  <div className="fl">Client / Authority</div>
                  <input className="fi" defaultValue={proj.initiatedByCompany?.name || "NHAI — National Highways Authority of India"} />
                </div>
                <div className="fg">
                  <div className="fl">Contractor</div>
                  <input className="fi" defaultValue={proj.epcOrganization?.name || "GR Infraprojects Limited"} />
                </div>
                <div className="fg">
                  <div className="fl">IE Firm</div>
                  <input className="fi" defaultValue={proj.billingCompany?.name || "STUP Consultants Pvt Ltd"} />
                </div>
                <div className="fg">
                  <div className="fl">Contract Number (auto-generated)</div>
                  <input className="fi font-mono text-[10px]" value={`NHAI/${proj.epcOrganization?.code || "GR-INFRA"}/${proj.projectCode}/20250412`} readOnly />
                  <div style={{ fontSize: "9px", color: "var(--color-text-ter)", marginTop: "2px" }}>Format: Client/Contractor/Project/GL-ID/Date · Override if needed</div>
                </div>
              </div>
              <div className="grid3 mt-2">
                <div className="fg">
                  <div className="fl">State</div>
                  <select className="fs" defaultValue={proj.state || "Bihar"}>
                    <option>Uttar Pradesh</option>
                    <option value="Bihar">Bihar</option>
                    <option>Haryana</option>
                    <option>Rajasthan</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">Investigation Start</div>
                  <input className="fi" type="date" defaultValue={proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : "2025-04-12"} />
                </div>
                <div className="fg">
                  <div className="fl">Expected Completion</div>
                  <input className="fi" type="date" defaultValue={proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : "2025-05-15"} />
                </div>
              </div>
            </div>

            {/* Investigation Parameters Card */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>⚙ Investigation Parameters</span>
                <span className="ct-lock">🔒 Locked — boring in progress</span>
              </div>
              <div className="ib ib-a">
                ⚠ These parameters apply to ALL borings in this project. Cannot be changed once any boring is started by a field worker.
              </div>
              <div className="grid2">
                <div className="fg">
                  <div className="fl">Boring Method</div>
                  <select className="fs" disabled defaultValue="rotary">
                    <option value="rotary">Rotary boring — NX size bit</option>
                    <option>Percussion boring</option>
                    <option>Wash boring</option>
                    <option>Auger boring</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">Drilling Fluid</div>
                  <select className="fs" disabled defaultValue="bentonite">
                    <option>Water</option>
                    <option value="bentonite">Bentonite slurry</option>
                    <option>Mud</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">Casing Used</div>
                  <select className="fs" disabled defaultValue="yes">
                    <option value="yes">Yes — 150mm dia NW casing</option>
                    <option>No casing</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">SPT Hammer Type</div>
                  <select className="fs" disabled defaultValue="is2131">
                    <option value="is2131">63.5 kg — 75cm free fall (IS 2131 Standard)</option>
                    <option value="donut">Donut Hammer — 63.5 kg</option>
                    <option value="safety">Safety Hammer — 63.5 kg</option>
                    <option value="nonstandard">Non-standard Hammer (Manual trip)</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">IS Code Applicable</div>
                  <select className="fs" disabled defaultValue="is1892">
                    <option value="is1892">IS 1892 + IRC 78 + IS 2131</option>
                    <option>RDSO + IRS Bridge Code</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">NABL Lab Assigned</div>
                  <select className="fs" disabled defaultValue="geocon">
                    <option value="geocon">{activeNablLab.name} — NABL {activeNablLab.code}</option>
                  </select>
                </div>
              </div>
              <div className="nabl-b mt-3">
                ✓ NABL Accreditation verified · {activeNablLab.name} · {activeNablLab.code} · Valid until {activeNablLab.validUntil}
              </div>
            </div>

            {/* Team Assignment Card */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>👥 Team Assignment</span>
                <span className="ct-action flex items-center gap-1"><RiUserAddLine /> Add member</span>
              </div>
              <div className="flex gap-2 mb-3">
                <button className="btn btn-p btn-sm">+ Add Team</button>
                <div className="text-[10px] text-text-ter self-center">
                  Multiple teams supported — each team gets separate boring assignments and team-prefixed IDs
                </div>
              </div>

              {/* Team A */}
              <div className="bg-bg-raised border border-border rounded-lg p-3 mb-2" style={{ borderColor: "rgba(216,90,48,.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-rust-d">Team A</span>
                  <span className="text-[10px] text-text-ter">· Borings: GL-BH-0047-A-01 to A-05</span>
                  <span className="pill p-g text-[8px] ml-auto">● On site</span>
                </div>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>GL ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Qualification</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectMembers.filter(m => m.team === "Team A").map((m, i) => (
                      <tr key={m.id || i}>
                        <td className="font-mono text-[9px] text-amber-d">{m.id}</td>
                        <td className="td-p">{m.name}</td>
                        <td>{m.role}</td>
                        <td>{m.qual || "N/A"}</td>
                        <td><span className="pill p-g">On site</span></td>
                        <td><button className="btn btn-s btn-sm">View log</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Team B */}
              <div className="bg-bg-raised border border-border rounded-lg p-3 mb-2" style={{ borderColor: "rgba(24,95,165,.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-blue-d">Team B</span>
                  <span className="text-[10px] text-text-ter">· Borings: GL-BH-0047-B-01 to B-05</span>
                  <span className="pill p-b text-[8px] ml-auto">Standby</span>
                </div>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>GL ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Qualification</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectMembers.filter(m => m.team === "Team B").map((m, i) => (
                      <tr key={m.id || i}>
                        <td className="font-mono text-[9px] text-blue-d">{m.id}</td>
                        <td className="td-p">{m.name}</td>
                        <td>{m.role}</td>
                        <td>{m.qual || "N/A"}</td>
                        <td><span className="pill p-b">Standby</span></td>
                        <td><button className="btn btn-b btn-sm">View log</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Engineer + Lab */}
              <div className="bg-bg-raised border border-border rounded-lg p-3" style={{ borderColor: "rgba(59,109,17,.15)" }}>
                <div className="text-[11px] font-bold text-green-d mb-2">Engineer + Lab</div>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>GL ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Credential</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectMembers.filter(m => m.team === "Engineer + Lab" || !m.team).map((m, i) => (
                      <tr key={m.id || i}>
                        <td className="font-mono text-[9px] text-green-d">{m.id}</td>
                        <td className="td-p">{m.name}</td>
                        <td>{m.role}</td>
                        <td>{m.qual || m.credential || "N/A"}</td>
                        <td><span className="pill p-g">Active</span></td>
                        <td><button className="btn btn-s btn-sm">View log</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Site Geology + Seismicity */}
            <div className="card shadow-sm">
              <div className="card-title">🌍 Site Geology + Seismicity</div>
              <div className="grid3 mb-2">
                <div className="fg">
                  <div className="fl">Seismic zone (IS 1893)</div>
                  <select className="fs" value={seismicZone} onChange={(e) => {
                    setSeismicZone(e.target.value);
                    if (e.target.value === "Zone I") setPga(0.06);
                    else if (e.target.value === "Zone II") setPga(0.10);
                    else if (e.target.value === "Zone III") setPga(0.16);
                    else if (e.target.value === "Zone IV") setPga(0.24);
                    else if (e.target.value === "Zone V") setPga(0.36);
                  }}>
                    <option>Zone I</option>
                    <option>Zone II</option>
                    <option>Zone III</option>
                    <option>Zone IV</option>
                    <option>Zone V</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">PGA (amax/g)</div>
                  <input className="fi font-mono" type="number" step="0.01" value={pga} onChange={(e) => setPga(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="fg">
                  <div className="fl">Geological formation</div>
                  <select className="fs">
                    <option>Alluvial plain</option>
                    <option>Lateritic</option>
                    <option>Hard rock</option>
                    <option>Mixed alluvial</option>
                    <option>Basaltic</option>
                  </select>
                </div>
              </div>
              <div className="bg-bg-raised rounded p-[6px_10px] text-[9px] text-text-ter">
                Seismic zone feeds liquefaction assessment automatically. PGA used in CSR/CRR calculation. Geology populates Site Reconnaissance chapter in PDF report.
              </div>
            </div>

            {/* Boring Locations Table with Excel import */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>📍 Boring Locations</span>
                <div className="flex gap-2">
                  <span className="ct-lock self-center">🔒 Locked after boring start</span>
                  <span className="ct-action self-center" onClick={() => setShowExcelSec(!showExcelSec)}>
                    {showExcelSec ? "✕ Close Excel tool" : "📂 Excel Import / Export"}
                  </span>
                </div>
              </div>

              {/* Excel Import Panel */}
              {showExcelSec && (
                <div className="bg-bg-raised border border-border rounded-lg p-3 mb-3 animate-fade-down">
                  <div className="ib ib-b">
                    ℹ Download the Excel template, fill boring locations with your structural engineer / contractor, then upload. Format: BH No. · Structure Type · Chainage · Easting · Northing · RL · Planned Depth
                  </div>
                  <div className="grid2 mb-2">
                    <button className="btn btn-b w-full">⬇ Download Excel template</button>
                    <div className="excel-zone py-2 flex flex-col justify-center items-center">
                      <div className="text-[16px] mb-1">📂</div>
                      <div className="text-[10px] font-semibold text-text-sec">Upload filled Excel</div>
                      <div className="text-[8px] text-text-ter">Click or drag locations file here</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-text-ter leading-relaxed bg-bg-card p-2 rounded">
                    <div className="font-semibold text-text-pri mb-1">Template columns:</div>
                    <div className="font-mono text-amber-d text-[8px] mb-1">BH_No | Sub_Structure | Structure_Type | Chainage | Span | Team | Easting | Northing | RL_mAmsl | Planned_Depth_m | Notes</div>
                    <div>Example: BH-01 | Abutment A | VUP | 134+550 | 1×20 | Team A | 521847.00 | 3148203.00 | 100.000 | 30.0 | A-1 abutment</div>
                  </div>
                </div>
              )}

              {/* Grid map placeholder */}
              <div className="map-wrap">
                <div className="map-bg2" />
                <div className="map-grid2" />
                {mappedBoreholes.map((bh, i) => {
                  const lefts = ["15%", "28%", "41%", "54%", "67%"];
                  const tops = ["55%", "50%", "52%", "48%", "51%"];
                  const icons = bh.status === "COMPLETED" ? "📍" : bh.status === "IN_PROGRESS" ? "🔵" : "⭕";
                  const color = bh.status === "COMPLETED" ? "#97C459" : bh.status === "IN_PROGRESS" ? "#85B7EB" : "#6B6966";
                  const label = bh.status === "COMPLETED" ? "✓" : bh.status === "IN_PROGRESS" ? "active" : "pending";
                  return (
                    <div key={bh.id || i} className="mp" style={{ left: lefts[i % 5], top: tops[i % 5] }}>
                      <span>{icons}</span>
                      <div className="mp-lbl" style={{ color }}>{bh.name.split(" ")[0]} {label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Full 11-column table */}
              <div className="overflow-x-auto">
                <table className="dt" style={{ minWidth: "900px" }}>
                  <thead>
                    <tr>
                      <th>BH ID</th>
                      <th>Location / Sub-structure</th>
                      <th style={{ color: "var(--color-rust-d)" }}>Structure Type</th>
                      <th style={{ color: "var(--color-rust-d)" }}>Chainage</th>
                      <th>Span</th>
                      <th>Team</th>
                      <th>Easting (m)</th>
                      <th>Northing (m)</th>
                      <th>RL (m)</th>
                      <th>Planned Depth (m)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedBoreholes.map((bh: any) => {
                      const st = BH_STATUS[bh.status] || BH_STATUS.PLANNED;
                      return (
                        <tr key={bh.id}>
                          <td className="font-mono text-[9px] text-amber-d">{bh.boreholeCode}</td>
                          <td className="td-p">{bh.name}</td>
                          <td><span className="font-mono text-[10px] font-semibold text-amber-d">{bh.structureType || "VUP"}</span></td>
                          <td><span className="font-mono text-[10px] font-semibold text-text-pri">{bh.chainage || "134+550"}</span></td>
                          <td className="text-text-ter">{bh.span || "1×20"}</td>
                          <td><span className={`pill ${bh.team === "Team B" ? "p-b" : "p-r"}`} style={{ fontSize: "8px" }}>{bh.team}</span></td>
                          <td className="font-mono text-[10px]">{bh.latitude}</td>
                          <td className="font-mono text-[10px]">{bh.longitude}</td>
                          <td className="font-mono text-[10px]">{bh.groundLevelRL ? bh.groundLevelRL.toFixed(3) : "—"}</td>
                          <td>{bh.plannedDepth ? bh.plannedDepth.toFixed(1) : "—"}</td>
                          <td><span className={`pill ${st.cls}`}>{st.text}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="btn-row justify-end mt-3">
                <button className="btn btn-p">Save Setup</button>
                <button className="btn btn-w flex items-center gap-1" onClick={() => setShowExcelSec(!showExcelSec)}>
                  📂 Import / Export Excel
                </button>
              </div>
            </div>

            {/* Sites Table */}
            {sites.length > 0 && (
              <div className="card shadow-sm">
                <div className="card-title">📍 Project Sites / structures ({sites.length})</div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Coordinates</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s: any) => (
                        <tr key={s.id}>
                          <td className="font-mono text-[9px] text-amber-d">{s.code}</td>
                          <td className="text-text-pri font-medium">{s.name}</td>
                          <td>{s.description || "—"}</td>
                          <td className="font-mono text-[9px]">{s.latitude ? `${s.latitude}, ${s.longitude}` : "—"}</td>
                          <td><span className={`pill ${s.isActive ? "pill-green" : "pill-gray"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📡 LIVE MONITOR TAB */}
        {activeTab === "monitor" && (
          <div className="animate-fade-in">
            {/* Summary counters */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-rust-mid p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Live borings</div>
                <div className="text-[20px] font-bold text-text-pri font-display">
                  {mappedBoreholes.filter(b => b.status === "IN_PROGRESS").length || 1}
                </div>
                <div className="text-[9px] text-text-ter mt-[1px]">B-01 active now</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-amber-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Anomalies</div>
                <div className="text-[20px] font-bold text-text-pri font-display" style={{ color: "#EF9F27" }}>
                  {Object.values(monitorAnomalies).filter(Boolean).length}
                </div>
                <div className="text-[9px] text-text-ter mt-[1px]">Pending review</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-green-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Entries today</div>
                <div className="text-[20px] font-bold text-text-pri font-display">47</div>
                <div className="text-[9px] text-text-ter mt-[1px]">Last 2 min ago</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-blue-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Photos</div>
                <div className="text-[20px] font-bold text-text-pri font-display">
                  {mappedBoreholes.reduce((sum, bh) => sum + (bh.media?.length || 0), 0) * 12 || 84}
                </div>
                <div className="text-[9px] text-text-ter mt-[1px]">All GPS verified</div>
              </div>
            </div>

            {/* 3D Bore Viewer */}
            <div className="bore-viewer shadow-sm">
              <div className="bv-header flex justify-between w-full">
                <div className="flex items-center">
                  <span className="text-[11px] font-semibold text-text-sec">Select borehole</span>
                  <select
                    className="bv-select font-mono"
                    value={selectedBhCode}
                    onChange={(e) => setSelectedBhCode(e.target.value)}
                  >
                    {mappedBoreholes.map((bh) => (
                      <option key={bh.id} value={bh.boreholeCode}>
                        {bh.boreholeCode} · {bh.name} · {bh.status === "COMPLETED" ? "Complete" : "In Progress"}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Anomaly && (
                  <span className="pill p-red shrink-0 text-[9px] font-semibold">⚠ Anomaly flagged</span>
                )}
              </div>

              <div className="bv-body">
                {/* 3D representation SVG */}
                <div className="bv-3d">
                  <div className="text-[9px] text-green-d mb-2 font-mono">
                    {selectedBorehole.boreholeCode} · {selectedBorehole.name} · {selectedBorehole.finalDepth.toFixed(1)}m · {selectedBorehole.status}
                  </div>

                  <svg width="100%" height="320" viewBox="0 0 280 320" style={{ maxWidth: "320px" }}>
                    {/* Depth axis */}
                    <line x1="35" y1="10" x2="35" y2="310" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    <text x="4" y="14" fontSize="8" fill="#6B6966" fontFamily="sans-serif">0m</text>
                    <text x="4" y="62" fontSize="8" fill="#6B6966" fontFamily="sans-serif">3m</text>
                    <text x="4" y="110" fontSize="8" fill="#6B6966" fontFamily="sans-serif">6m</text>
                    <text x="4" y="158" fontSize="8" fill="#6B6966" fontFamily="sans-serif">9m</text>
                    <text x="4" y="206" fontSize="8" fill="#6B6966" fontFamily="sans-serif">12m</text>
                    <text x="4" y="254" fontSize="8" fill="#6B6966" fontFamily="sans-serif">15m</text>
                    <text x="4" y="302" fontSize="8" fill="#6B6966" fontFamily="sans-serif">18m</text>

                    {/* horizontal gridlines */}
                    <line x1="35" y1="10" x2="200" y2="10" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                    <line x1="35" y1="58" x2="200" y2="58" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                    <line x1="35" y1="106" x2="200" y2="106" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                    <line x1="35" y1="154" x2="200" y2="154" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                    <line x1="35" y1="202" x2="200" y2="202" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                    <line x1="35" y1="250" x2="200" y2="250" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                    <line x1="35" y1="298" x2="200" y2="298" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

                    {/* Dynamic Soil layers from selected borehole intervals */}
                    {selectedBorehole.intervals.slice(0, 5).map((interval: any, idx: number) => {
                      const colors = getSoilColors(interval.soilDescription);
                      const startY = 10 + interval.fromDepth * 16;
                      const height = (interval.toDepth - interval.fromDepth) * 16;
                      return (
                        <g key={interval.id || idx}>
                          <rect x="38" y={startY} width="80" height={height} fill={colors.fill} rx="1" />
                          <rect x="38" y={startY} width="80" height={height} fill="none" stroke={colors.stroke} strokeWidth="0.5" />
                          {height > 15 && (
                            <text x="42" y={startY + height / 2 + 3} fontSize="7" fill={colors.textColor}>
                              {interval.soilDescription}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Anomaly band (Only on BH03 7.5-9m) */}
                    {selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Anomaly && (
                      <g>
                        <rect x="35" y="130" width="86" height="24" fill="rgba(163,45,45,0.25)" rx="1" />
                        <rect x="35" y="130" width="86" height="24" fill="none" stroke="#A32D2D" strokeWidth="1" strokeDasharray="3,2" />
                        <text x="40" y="145" fontSize="7" fill="#F09595" fontWeight="bold">⚠ N=42 statistical anomaly</text>
                      </g>
                    )}

                    {/* Borehole shaft outline */}
                    <rect x="88" y="10" width="12" height={selectedBorehole.status === "IN_PROGRESS" ? "200" : "300"} fill="#0A120A" rx="2" />
                    <rect x="88" y="10" width="12" height={selectedBorehole.status === "IN_PROGRESS" ? "200" : "300"} fill="none" stroke="#1A2E1A" strokeWidth="0.5" />
                    <ellipse cx="94" cy="10" rx="6" ry="2" fill="#0A0A0A" />

                    {/* N-value bars */}
                    <line x1="121" y1="30" x2="121" y2="300" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                    {selectedBorehole.intervals.slice(0, 5).map((interval: any, idx: number) => {
                      const startY = 10 + interval.fromDepth * 16;
                      const height = (interval.toDepth - interval.fromDepth) * 16;
                      const nVal = interval.nValue || 0;
                      const width = Math.min(nVal * 0.6, 60);
                      const isAnom = selectedBhCode === "GL-BH-0047-A-03" && interval.fromDepth >= 7.0 && interval.toDepth <= 9.0 && monitorAnomalies.bh03Anomaly;
                      const color = isAnom ? "#F09595" : "#FAC775";
                      return (
                        <g key={interval.id || idx}>
                          <rect x="122" y={startY + height / 2 - 2} width={width} height="4" fill={color} rx="1" />
                          <text x={122 + width + 4} y={startY + height / 2 + 1} fontSize="7" fill={color} fontFamily="monospace">
                            N={nVal}{isAnom ? "⚠" : ""}
                          </text>
                        </g>
                      );
                    })}

                    {/* Water table indicator line */}
                    {selectedBorehole.waterTable && (
                      <g>
                        <line x1="35" y1={10 + selectedBorehole.waterTable * 16} x2="200" y2={10 + selectedBorehole.waterTable * 16} stroke="#378ADD" strokeWidth="1" strokeDasharray="3,2" opacity="0.8" />
                        <text x="36" y={10 + selectedBorehole.waterTable * 16 - 2} fontSize="7" fill="#85B7EB" fontFamily="monospace">
                          WT {selectedBorehole.waterTable.toFixed(2)}m
                        </text>
                      </g>
                    )}

                    {/* Legend */}
                    <g transform="translate(0, 306)">
                      <rect x="38" y="0" width="8" height="6" fill="#1A2E1A" rx="1" /><text x="49" y="6" fontSize="6" fill="#6B6966">Fill</text>
                      <rect x="70" y="0" width="8" height="6" fill="#2A2010" rx="1" /><text x="81" y="6" fontSize="6" fill="#6B6966">Silt</text>
                      <rect x="102" y="0" width="8" height="6" fill="#281818" rx="1" /><text x="113" y="6" fontSize="6" fill="#6B6966">Clay</text>
                      <rect x="134" y="0" width="8" height="6" fill="#201A08" rx="1" /><text x="145" y="6" fontSize="6" fill="#6B6966">Sand</text>
                      <rect x="166" y="0" width="8" height="6" fill="#151515" rx="1" /><text x="177" y="6" fontSize="6" fill="#6B6966">Rock</text>
                    </g>
                  </svg>
                </div>

                {/* Right detail panel */}
                <div className="bv-right">
                  <div className="bv-right-title">{selectedBorehole.boreholeCode} · {selectedBorehole.name}</div>
                  
                  <div className="dr">
                    <span className="dr-l">Status</span>
                    <span className={`dr-v ${selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Anomaly ? "warn" : "ok"}`}>
                      {selectedBorehole.status === "IN_PROGRESS" ? "● In progress" : selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Anomaly ? "⚠ Anomaly flagged" : "✓ Complete"}
                    </span>
                  </div>
                  <div className="dr"><span className="dr-l">Start</span><span className="dr-v ok">{selectedBorehole.startedAt ? new Date(selectedBorehole.startedAt).toLocaleString("en-IN", { hour: "numeric", minute: "numeric", hour12: true, day: "numeric", month: "short" }) : "—"}</span></div>
                  <div className="dr"><span className="dr-l">End</span><span className="dr-v ok">{selectedBorehole.completedAt ? new Date(selectedBorehole.completedAt).toLocaleString("en-IN", { hour: "numeric", minute: "numeric", hour12: true, day: "numeric", month: "short" }) : "In progress"}</span></div>
                  <div className="dr"><span className="dr-l">Total depth</span><span className="dr-v">{selectedBorehole.finalDepth.toFixed(1)}m</span></div>
                  <div className="dr">
                    <span className="dr-l">Easting</span>
                    <span className={`dr-v ${selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Gps ? "warn" : ""}`}>
                      {selectedBorehole.latitude} {selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Gps && "(dev +4.2m)"}
                    </span>
                  </div>
                  <div className="dr"><span className="dr-l">RL</span><span className="dr-v">{selectedBorehole.groundLevelRL ? `${selectedBorehole.groundLevelRL.toFixed(3)}m` : "—"}</span></div>
                  <div className="dr"><span className="dr-l">Water table</span><span className="dr-v ok">{selectedBorehole.waterTable ? `${selectedBorehole.waterTable.toFixed(2)}m` : "—"}</span></div>
                  <div className="dr"><span className="dr-l">SPT intervals</span><span className="dr-v">{selectedBorehole.intervals.length}</span></div>
                  <div className="dr"><span className="dr-l">Photos</span><span className="dr-v">{selectedBorehole.media.length} uploaded</span></div>

                  {selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Anomaly && (
                    <div className="mt-2 p-2 bg-[#FCEBEB] border border-[#F09595] rounded-md animate-fade-in">
                      <div className="text-[9px] font-semibold text-red-700 mb-0.5">⚠ Anomaly — 8.5m depth</div>
                      <div className="text-[9px] text-[#A32D2D] leading-relaxed mb-1.5">
                        N=42 at 8.5m. Adjacent BH-01 shows N=12, BH-02 shows N=11. statistical probability: 8%.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMonitorAnomalies(prev => ({ ...prev, bh03Anomaly: false }))}
                          className="btn btn-s btn-sm py-1 flex-1 cursor-pointer"
                        >
                          Accept N=42
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("review");
                            setExpandedBhId("bh03");
                          }}
                          className="btn btn-p btn-sm py-1 flex-1 text-center cursor-pointer"
                        >
                          Modify N
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border my-2" />
                  <div className="text-[9px] font-semibold text-text-ter uppercase">Site Photos</div>
                  <div className="photo-grid">
                    {selectedBorehole.media.map((med: any) => (
                      <div key={med.id} className="photo-thumb">
                        <div className="pt-icon">🔩</div>
                        <div className="pt-label">{med.photoType}</div>
                      </div>
                    ))}
                    <div className="photo-thumb border-dashed border-border flex flex-col items-center justify-center p-1">
                      <div className="text-[10px] text-text-ter">+</div>
                      <div className="text-[7px] text-text-ter">Add</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Anomaly Alerts box */}
            <div className="text-[10px] font-bold text-red-500 tracking-[0.5px] uppercase mb-2">🚨 Anomaly Alerts — Action Required</div>
            {selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Anomaly && (
              <div className="anom-card">
                <div className="anom-hdr">
                  <span className="pill p-red text-[8px] uppercase">🚨 Critical</span>
                  <span className="anom-title">GL-BH-0047-A-03 · Pier P1 · 8.5m — N=42 statistical anomaly</span>
                </div>
                <div className="anom-body">
                  N-value jumps from N=12 at 7.5m to N=42 at 8.5m — 250% jump. Adjacent BH-A-01 and BH-A-02 show N=10–14 at same depth. Probability of natural occurrence: 8%.
                </div>
                <div className="anom-actions">
                  <button onClick={() => { setActiveTab("review"); setExpandedBhId("bh03"); }} className="btn btn-d btn-sm">🚩 Flag for correction</button>
                  <button className="btn btn-w btn-sm">💬 Query team</button>
                  <button onClick={() => setMonitorAnomalies(prev => ({ ...prev, bh03Anomaly: false }))} className="btn btn-s btn-sm">✓ Accept as valid</button>
                </div>
              </div>
            )}

            {selectedBhCode === "GL-BH-0047-A-03" && monitorAnomalies.bh03Gps && (
              <div className="anom-card bg-[rgba(186,117,23,.03)] border-[rgba(186,117,23,.15)]">
                <div className="anom-hdr">
                  <span className="pill p-a text-[8px] uppercase">⚠ Warning</span>
                  <span className="anom-title text-amber-500">GL-BH-0047-A-03 · GPS deviation 4.2m from planned location</span>
                </div>
                <div className="anom-body">
                  Actual coordinates deviate 4.2m from planned location. Threshold: 3.0m. Must be acknowledged or corrected.
                </div>
                <div className="anom-actions">
                  <button className="btn btn-w btn-sm">📝 Add to report</button>
                  <button onClick={() => setMonitorAnomalies(prev => ({ ...prev, bh03Gps: false }))} className="btn btn-s btn-sm">✓ Acknowledge</button>
                </div>
              </div>
            )}

            {/* Live Data Feed */}
            <div className="card shadow-sm">
              <div className="card-title">📡 Live Data Feed — Real Time</div>
              {logs.map((log: any) => (
                <div key={log.id} className="feed-item">
                  <div className={`fdot ${log.action.includes("ANOMALY") ? "fd-red" : log.action.includes("WATER") ? "fd-a" : "fd-g"}`} />
                  <div className="fc">
                    <div className="ft">{log.entityId} · {log.action}</div>
                    <div className="fs2">{log.detail} · By {log.user?.firstName} {log.user?.lastName}</div>
                  </div>
                  <div className="ftime">{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✓ REVIEW TAB */}
        {activeTab === "review" && (
          <div className="animate-fade-in">
            <div className="ib ib-b shadow-sm">
              ℹ Engineer review: Modifications require mandatory IS code reason. Original entry always preserved. All modifications logged with your name, timestamp, IS clause reference.
            </div>

            {mappedBoreholes.map((bh: any) => {
              const isOpen = expandedBhId === bh.id || expandedBhId === bh.boreholeCode;
              const isCompleted = bh.status === "COMPLETED";
              const isAppr = bhStatusApproved[bh.id] || bhStatusApproved[bh.boreholeCode];

              return (
                <div key={bh.id} className="mb-2" style={{ opacity: isCompleted ? 1 : 0.6 }}>
                  <div
                    onClick={() => {
                      if (!isCompleted) return;
                      setExpandedBhId(isOpen ? null : bh.id);
                    }}
                    className={`brh ${!isCompleted ? "cursor-not-allowed" : ""} ${!isAppr && bh.id === "bh03" && !reviewApplied ? "flagged" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="brh-id">{bh.boreholeCode}</div>
                      <div className="brh-name">{bh.name}</div>
                      <div className="brh-meta">
                        {bh.finalDepth.toFixed(1)}m · {bh.intervals.length} SPT intervals · {bh.team} 
                        {!isCompleted && " · Cannot review until boring is closed"}
                      </div>
                    </div>
                    {isCompleted ? (
                      <span className={`pill ${isAppr ? "p-g" : bh.id === "bh03" && !reviewApplied ? "p-red" : "p-gr"} ml-auto text-[9px]`}>
                        {isAppr ? "✓ Approved" : bh.id === "bh03" && !reviewApplied ? "🚨 Review required" : "○ Not reviewed"}
                      </span>
                    ) : (
                      <span className="pill p-gr ml-auto text-[9px]">In Progress</span>
                    )}
                    {isCompleted && (
                      <span className={`brh-chevron ${isOpen ? "open" : ""}`}>▾</span>
                    )}
                  </div>

                  {isOpen && isCompleted && (
                    <div className="bg-bg-card border border-border rounded-b-[7px] p-3 -mt-2 mb-2 animate-fade-down">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-semibold text-text-ter uppercase">SPT Interval Readings</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBhStatusApproved(prev => ({ ...prev, [bh.id]: true, [bh.boreholeCode]: true }))}
                            className="btn btn-s btn-sm cursor-pointer"
                          >
                            ✓ Approve Boring
                          </button>
                        </div>
                      </div>

                      <table className="spt-tbl">
                        <thead>
                          <tr>
                            <th>Depth</th>
                            <th>0–15cm</th>
                            <th>15–30cm</th>
                            <th>30–45cm</th>
                            <th>Raw N</th>
                            <th>Corr N</th>
                            <th>Soil Type</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bh.intervals.map((item: any, idx: number) => {
                            const isAnomInterval = bh.id === "bh03" && item.fromDepth === 7.5;
                            return (
                              <tr key={item.id || idx} className={isAnomInterval && !reviewApplied ? "flagged" : ""}>
                                <td>{item.fromDepth.toFixed(1)}-{item.toDepth.toFixed(1)}m</td>
                                <td>{item.blow1}</td>
                                <td>{item.blow2}</td>
                                <td>{item.blow3}</td>
                                <td className={isAnomInterval && !reviewApplied ? "nv-flag" : "nv"}>
                                  {isAnomInterval && reviewApplied ? `${correctedNValue} (Corr)` : item.nValue}
                                </td>
                                <td>{isAnomInterval && reviewApplied ? 16 : item.nCorrected}</td>
                                <td>{item.soilDescription}</td>
                                <td>
                                  <span className={`pill ${(isAnomInterval && !reviewApplied) ? "p-red" : "p-g"}`}>
                                    {(isAnomInterval && !reviewApplied) ? "🚨" : "✓"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {bh.id === "bh03" && (
                        <div className="border-t border-border pt-3 mt-2">
                          {!reviewApplied ? (
                            <div className="mod-panel animate-fade-in">
                              <div className="mod-title">✏ Modify — GL-BH-0047-A-03 · 8.5m · N-value</div>
                              <div className="mod-row">
                                <div className="mod-orig">Original N = 42</div>
                                <div className="text-rust-d">→</div>
                                <input
                                  type="number"
                                  className="fi w-[75px] text-center"
                                  value={correctedNValue}
                                  onChange={(e) => setCorrectedNValue(parseInt(e.target.value) || 0)}
                                />
                                <div className="mod-new">Corrected N = {correctedNValue}</div>
                              </div>
                              <div className="fg mb-3">
                                <div className="fl">IS Code Reason — Mandatory</div>
                                <select className="fs" value={selectedClause} onChange={(e) => setSelectedClause(e.target.value)}>
                                  <option>IS 2131 Cl.6.3 — Casing disturbance · Adjacent BH-A-01 N=12, BH-A-02 N=11</option>
                                  <option>IS 2131 Cl.5.2 — Gravel pocket encountered</option>
                                  <option>IS 2131 Cl.6.1 — Water table correction</option>
                                </select>
                              </div>
                              <div className="btn-row">
                                <button
                                  onClick={() => {
                                    setReviewApplied(true);
                                    setBhStatusApproved(prev => ({ ...prev, bh03: true, ["GL-BH-0047-A-03"]: true }));
                                  }}
                                  className="btn btn-p btn-sm cursor-pointer"
                                >
                                  Apply Modification
                                </button>
                                <button className="btn btn-w btn-sm">Query Field Team</button>
                                <button
                                  onClick={() => {
                                    setCorrectedNValue(42);
                                    setReviewApplied(true);
                                    setBhStatusApproved(prev => ({ ...prev, bh03: true, ["GL-BH-0047-A-03"]: true }));
                                  }}
                                  className="btn btn-s btn-sm cursor-pointer"
                                >
                                  Accept N=42 as Valid
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-[rgba(59,109,17,.08)] border border-green-d rounded-md text-[10px] text-green-d leading-relaxed font-semibold animate-fade-in">
                              ✓ Modification applied successfully: N=42 corrected to N={correctedNValue} under {selectedClause}. Logged under Er. Rajesh Kumar.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 🧪 LAB TAB */}
        {activeTab === "lab" && (
          <div className="animate-fade-in">
            {/* Stat row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-green-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Total samples</div>
                <div className="text-[20px] font-bold text-text-pri font-display">18</div>
                <div className="text-[9px] text-text-ter mt-[1px]">All borings</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-blue-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Results entered</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{labSaved ? "12" : "11"}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{labSaved ? "67% complete" : "61% complete"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-amber-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Approaching expiry</div>
                <div className="text-[20px] font-bold text-text-pri font-display" style={{ color: "#EF9F27" }}>
                  {labSaved ? "2" : "3"}
                </div>
                <div className="text-[9px] text-text-ter mt-[1px]">Within 3 days</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-rust-mid p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Overdue</div>
                <div className="text-[20px] font-bold text-text-pri font-display">0</div>
                <div className="text-[9px] text-text-ter mt-[1px]">All within limit</div>
              </div>
            </div>

            <div className="nabl-b mb-3">
              ✓ {activeNablLab.name} · NABL {activeNablLab.code} · Valid until {activeNablLab.validUntil} · CC Verified
            </div>

            {/* Sample Tracking card */}
            <div className="card shadow-sm">
              <div className="card-title">🧪 Sample Tracking</div>
              <div className="overflow-x-auto border border-border rounded-md">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sample ID</th>
                      <th>Depth</th>
                      <th>Tests Required</th>
                      <th>Timer</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      onClick={() => setSelectedSampleId("GL-BH01-1.5-S1")}
                      className={`cursor-pointer ${selectedSampleId === "GL-BH01-1.5-S1" ? "bg-bg-raised font-semibold" : ""}`}
                    >
                      <td className="font-mono text-[9px] text-green-d">GL-BH01-1.5-S1</td>
                      <td className="text-text-sec">1.5m SPT</td>
                      <td className="text-text-ter">Sieve + LL + PL + Spec. gravity</td>
                      <td><span className="text-green-700 bg-[rgba(59,109,17,.08)] px-2 py-0.5 rounded text-[9px]">✓ Results in</span></td>
                      <td><span className="pill p-g">Complete</span></td>
                    </tr>
                    <tr
                      onClick={() => setSelectedSampleId("GL-BH03-4.5-S1")}
                      className={`cursor-pointer ${selectedSampleId === "GL-BH03-4.5-S1" ? "bg-bg-raised font-semibold" : ""}`}
                    >
                      <td className="font-mono text-[9px] text-green-d">GL-BH03-4.5-S1</td>
                      <td className="text-text-sec">4.5m SPT</td>
                      <td className="text-text-ter">Sieve + LL + PL</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[9px] ${labSaved ? "text-green-d bg-[rgba(59,109,17,.08)]" : "text-amber-d bg-[rgba(186,117,23,.08)]"}`}>
                          {labSaved ? "✓ Results in" : "⏰ 3 days left"}
                        </span>
                      </td>
                      <td><span className={`pill ${labSaved ? "p-g" : "p-a"}`}>{labSaved ? "Complete" : "Pending"}</span></td>
                    </tr>
                    <tr
                      onClick={() => setSelectedSampleId("GL-BH03-9.0-U1")}
                      className={`cursor-pointer ${selectedSampleId === "GL-BH03-9.0-U1" ? "bg-bg-raised font-semibold" : ""}`}
                    >
                      <td className="font-mono text-[9px] text-blue-d">GL-BH03-9.0-U1</td>
                      <td className="text-text-sec">9.0m UDS</td>
                      <td className="text-text-ter">Consolidation + Triaxial UU + UCS</td>
                      <td><span className="text-amber-d bg-[rgba(186,117,23,.08)] px-2 py-0.5 rounded text-[9px]">⏰ 3 days left</span></td>
                      <td><span className="pill p-a">Pending</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enter Lab Results card */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>🧪 Enter Lab Results — {selectedSampleId}</span>
                <span className="text-text-ter normal-case text-[9px] font-normal">Red Clay · 4.5m · Disturbed</span>
              </div>
              <div className="ib ib-a">
                {labSaved ? "✓ Lab results locked & saved by tech GL-L-0008." : "⏰ 3 days remaining. Lab tech GL-L-0008 notified. IS code auto-tagged to each test below."}
              </div>

              {/* Step 1 */}
              <div className="sl">Step 1 — Grain size analysis (IS 2720 Part 4)</div>
              <div className="grid3 mb-3">
                <div className="fg">
                  <div className="fl">Silt + Clay % (&lt;0.075mm)</div>
                  <input
                    type="number"
                    className="fi"
                    value={gSiltClay}
                    onChange={(e) => setGSiltClay(parseFloat(e.target.value) || 0)}
                    disabled={labSaved}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Fine sand %</div>
                  <input
                    type="number"
                    className="fi"
                    value={gFineSand}
                    onChange={(e) => setGFineSand(parseFloat(e.target.value) || 0)}
                    disabled={labSaved}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Classification (Auto)</div>
                  <input className="fi font-mono" value={uscsSymbol} readOnly />
                </div>
              </div>

              {/* Grain size curve SVG graph */}
              <div className="bg-bg-raised border border-border rounded-[7px] p-3 mb-3">
                <div className="text-[9px] text-text-ter font-semibold uppercase tracking-[0.4px] mb-2">
                  Auto-generated Grain Size Distribution Curve
                </div>
                <div className="h-[140px] bg-bg-card rounded border border-border flex items-center justify-center p-2 relative">
                  <svg width="100%" height="100%" viewBox="0 0 400 120" className="opacity-90">
                    <line x1="20" y1="10" x2="380" y2="10" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="20" y1="40" x2="380" y2="40" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="20" y1="70" x2="380" y2="70" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="20" y1="100" x2="380" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />

                    <line x1="20" y1="10" x2="20" y2="100" stroke="#444" strokeWidth="0.5" />
                    <line x1="110" y1="10" x2="110" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                    <line x1="200" y1="10" x2="200" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                    <line x1="290" y1="10" x2="290" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                    <line x1="380" y1="10" x2="380" y2="100" stroke="#444" strokeWidth="0.5" />

                    {/* curve plot */}
                    <path
                      d={`M 20,95 Q 110,${100 - gSiltClay * 0.8} 200,${100 - (gSiltClay + gFineSand) * 0.8} T 380,15`}
                      fill="none"
                      stroke="var(--color-rust-mid)"
                      strokeWidth="2"
                    />

                    {/* axes labels */}
                    <text x="18" y="115" fontSize="7" fill="#6B6966">0.001mm</text>
                    <text x="105" y="115" fontSize="7" fill="#6B6966">0.075mm</text>
                    <text x="195" y="115" fontSize="7" fill="#6B6966">0.425mm</text>
                    <text x="285" y="115" fontSize="7" fill="#6B6966">2.0mm</text>
                    <text x="365" y="115" fontSize="7" fill="#6B6966">4.75mm</text>
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="sl">Step 2 — Atterberg limits (IS 2720 Part 5)</div>
              <div className="grid3 mb-3">
                <div className="fg">
                  <div className="fl">Liquid Limit — LL (%)</div>
                  <input
                    type="number"
                    className="fi"
                    value={liquidLimit}
                    onChange={(e) => setLiquidLimit(parseFloat(e.target.value) || 0)}
                    disabled={labSaved}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Plastic Limit — PL (%)</div>
                  <input
                    type="number"
                    className="fi"
                    value={plasticLimit}
                    onChange={(e) => setPlasticLimit(parseFloat(e.target.value) || 0)}
                    disabled={labSaved}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Plasticity Index — PI (Auto)</div>
                  <input className="fi font-mono" value={plasticityIndex} readOnly />
                </div>
              </div>
              <div className="bg-bg-raised rounded-md p-2 mb-3 flex items-center justify-between border border-border">
                <span className={`text-[10px] font-semibold ${isPlastic ? "text-green-700" : "text-amber-700"}`}>
                  {isPlastic ? "✓ Plastic soil — LL/PL recorded" : "○ Non-plastic (NP) soil layer"}
                </span>
                <span className="text-[8px] text-text-ter">Auto-classifies into plasticity charts</span>
              </div>

              {/* Step 3 */}
              <div className="sl">Step 3 — Density + physical properties (IS 2720 Part 2 & 3)</div>
              <div className="grid3 mb-3">
                <div className="fg">
                  <div className="fl">Bulk Density (g/cc)</div>
                  <input
                    type="number"
                    className="fi"
                    step="0.01"
                    value={bulkDensity}
                    onChange={(e) => setBulkDensity(parseFloat(e.target.value) || 0)}
                    disabled={labSaved}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Natural moisture content (%)</div>
                  <input
                    type="number"
                    className="fi"
                    step="0.1"
                    value={moistureContent}
                    onChange={(e) => setMoistureContent(parseFloat(e.target.value) || 0)}
                    disabled={labSaved}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Dry Density — dry (g/cc)</div>
                  <input className="fi font-mono" value={dryDensity} readOnly />
                </div>
                <div className="fg">
                  <div className="fl">Specific gravity (Gs)</div>
                  <input
                    type="number"
                    className="fi"
                    step="0.01"
                    value={specificGravity}
                    onChange={(e) => setSpecificGravity(parseFloat(e.target.value) || 0)}
                    disabled={labSaved}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Void ratio — e (Auto)</div>
                  <input className="fi font-mono" value={voidRatio} readOnly />
                </div>
                <div className="fg">
                  <div className="fl">Porosity — n % (Auto)</div>
                  <input className="fi font-mono" value={porosity} readOnly />
                </div>
              </div>

              {/* Step 4 */}
              <div className="sl">Step 4 — Shear strength (Triaxial UU / Consolidated CU / DST CD)</div>
              <div className="grid3 mb-3">
                <div className="p-3 bg-green-900/5 border border-green-900/15 rounded-md">
                  <div className="text-[9px] font-semibold text-green-600 mb-1.5 uppercase">UU — Unconsolidated Undrained (IS 2720 Pt 11)</div>
                  <div className="flex gap-2">
                    <div className="fg flex-1"><span className="fl">c (kg/cm²)</span><input className="fi py-1 px-2 text-[10px]" type="number" step="0.01" value={uuC} onChange={(e) => setUuC(parseFloat(e.target.value) || 0)} disabled={labSaved} /></div>
                    <div className="fg flex-1"><span className="fl">φ (deg)</span><input className="fi py-1 px-2 text-[10px]" type="number" value={uuPhi} onChange={(e) => setUuPhi(parseInt(e.target.value) || 0)} disabled={labSaved} /></div>
                  </div>
                </div>
                <div className="p-3 bg-amber-900/5 border border-amber-900/15 rounded-md">
                  <div className="text-[9px] font-semibold text-amber-600 mb-1.5 uppercase">CU — Consolidated Undrained (IS 2720 Pt 12)</div>
                  <div className="flex gap-2">
                    <div className="fg flex-1"><span className="fl">c (kg/cm²)</span><input className="fi py-1 px-2 text-[10px]" type="number" step="0.01" value={cuC} onChange={(e) => setCuC(parseFloat(e.target.value) || 0)} disabled={labSaved} /></div>
                    <div className="fg flex-1"><span className="fl">φ (deg)</span><input className="fi py-1 px-2 text-[10px]" type="number" value={cuPhi} onChange={(e) => setCuPhi(parseInt(e.target.value) || 0)} disabled={labSaved} /></div>
                  </div>
                </div>
                <div className="p-3 bg-blue-900/5 border border-blue-900/15 rounded-md">
                  <div className="text-[9px] font-semibold text-blue-600 mb-1.5 uppercase">CD — Consolidated Drained (IS 2720 Pt 13)</div>
                  <div className="flex gap-2">
                    <div className="fg flex-1"><span className="fl">c (kg/cm²)</span><input className="fi py-1 px-2 text-[10px]" type="number" step="0.01" value={cdC} onChange={(e) => setCdC(parseFloat(e.target.value) || 0)} disabled={labSaved} /></div>
                    <div className="fg flex-1"><span className="fl">φ (deg)</span><input className="fi py-1 px-2 text-[10px]" type="number" value={cdPhi} onChange={(e) => setCdPhi(parseInt(e.target.value) || 0)} disabled={labSaved} /></div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="sl">Step 5 — Consolidation (IS 2720 Part 15)</div>
              <div className="grid4 mb-3">
                <div className="fg">
                  <div className="fl">Cc — Compression Index</div>
                  <input className="fi" type="number" step="0.01" value={cc} onChange={(e) => setCc(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">Cv (cm²/sec)</div>
                  <input className="fi" type="number" step="0.0001" value={cv} onChange={(e) => setCv(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">mv (cm²/kg)</div>
                  <input className="fi" type="number" step="0.00001" value={mv} onChange={(e) => setMv(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">Pre-Consol. Pc (kg/cm²)</div>
                  <input className="fi" type="number" step="0.1" value={pc} onChange={(e) => setPc(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
              </div>

              {/* Step 6 */}
              <div className="sl">Step 6 — Rock tests (IS 9143)</div>
              <div className="grid3 mb-3">
                <div className="fg">
                  <div className="fl">UCS Strength (MPa)</div>
                  <input className="fi" type="number" value={ucs} onChange={(e) => setUcs(parseInt(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">Point Load Index Is(50) (MPa)</div>
                  <input className="fi" type="number" step="0.1" value={pointLoad} onChange={(e) => setPointLoad(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">Rock Classification</div>
                  <input className="fi" value={rockClass} onChange={(e) => setRockClass(e.target.value)} disabled={labSaved} />
                </div>
              </div>

              {/* Step 7 */}
              <div className="sl">Step 7 — Chemical Analysis (IS 2720 Part 22-27)</div>
              <div className="grid4 mb-3">
                <div className="fg">
                  <div className="fl">pH Value</div>
                  <input className="fi" type="number" step="0.1" value={ph} onChange={(e) => setPh(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">Sulphates SO3 (%)</div>
                  <input className="fi" type="number" step="0.01" value={sulphates} onChange={(e) => setSulphates(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">Chlorides Cl (%)</div>
                  <input className="fi" type="number" step="0.01" value={chlorides} onChange={(e) => setChlorides(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
                <div className="fg">
                  <div className="fl">Organic matter (%)</div>
                  <input className="fi" type="number" step="0.1" value={organic} onChange={(e) => setOrganic(parseFloat(e.target.value) || 0)} disabled={labSaved} />
                </div>
              </div>

              {/* Upload Zone */}
              <div className="fg mt-3">
                <div className="fl">Upload Machine Output Scan — Mandatory</div>
                <div className="excel-zone mt-1 py-3">
                  <div className="excel-icon">📎</div>
                  <div className="excel-text">Scanned_Output_GL-BH03-4.5.pdf</div>
                  <div className="excel-sub">Locked and SHA-256 hashed after saving</div>
                </div>
              </div>

              {/* Save draft / save and lock buttons */}
              <div className="btn-row justify-end mt-4">
                <button className="btn btn-w" disabled={labSaved}>Save Draft</button>
                <button
                  onClick={() => setLabSaved(true)}
                  className="btn btn-p flex items-center gap-1 cursor-pointer"
                  disabled={labSaved}
                >
                  <RiLock2Line /> {labSaved ? "Locked & Saved" : "Lock & Save Results"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📄 REPORT TAB */}
        {activeTab === "report" && (
          <div className="animate-fade-in">
            <div className="ib ib-g shadow-sm">
              ✓ BH-A-01 approved. BH-A-02 approved. BH-A-03 review completed. BH-B-01 in progress. Complete geotechnical report preview available.
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Generate Report parameters */}
              <div className="card shadow-sm">
                <div className="card-title">📄 Generate Report</div>
                <div className="fg mb-2">
                  <div className="fl">Scope</div>
                  <select className="fs">
                    <option>Completed borings — A-01 + A-02 + A-03</option>
                    <option>Full project (all 5 borings)</option>
                  </select>
                </div>
                <div className="fg mb-3">
                  <div className="fl">Format</div>
                  <select className="fs">
                    <option>IS 1892 — NHAI submission</option>
                    <option>IRC 78 — Bridge foundation</option>
                    <option>RDSO — Railway format</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 text-[10px] text-text-sec mb-3">
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure I — Borehole Location Map (GPS)</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure II — IS 1892 boring log sheets</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure III — Material characteristic table</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure IV — Grain size curves</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure V — Shear Strength Envelope curves</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure VI — Settlement & Pile capacity</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure VII — Triaxial UU/CU raw machine logs</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure VIII — Consolidation Cc/Cv curves</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure IX — Rock Core Core box high-res photos</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure X — Chemical analysis certificates</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure XI — Calibration certificates for SPT rigs</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure XII — GPS Anomaly Audit log</label>
                </div>
                <div className="border-t border-border pt-2 mb-3">
                  <div className="text-[9px] font-semibold text-text-ter uppercase mb-1">Settlement & Failure criteria</div>
                  <div className="grid3">
                    <div className="fg">
                      <div className="fl">Allowable (mm)</div>
                      <input
                        type="number"
                        className="fi"
                        value={allowableSettlement}
                        onChange={(e) => setAllowableSettlement(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="fg">
                      <div className="fl">Rigidity Factor</div>
                      <input
                        type="number"
                        step="0.05"
                        className="fi"
                        value={rigidityFactor}
                        onChange={(e) => setRigidityFactor(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="fg">
                      <div className="fl">Shear failure mode</div>
                      <select className="fs" value={shearFailureMode} onChange={(e) => setShearFailureMode(e.target.value)}>
                        <option>General shear failure</option>
                        <option>Local shear failure</option>
                        <option>Punching shear failure</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="dl-btn flex-1 flex justify-center items-center gap-1 py-2 bg-rust-mid text-white rounded cursor-pointer text-[11px]" onClick={() => setReportGenerated(true)}>
                    <RiDownloadLine /> Generate PDF Report
                  </button>
                  <button className="flex-1 flex justify-center items-center gap-1 py-2 border border-border-mid rounded text-text-sec text-[11px] bg-transparent cursor-pointer">
                    Export Excel Data
                  </button>
                </div>
              </div>

              {/* Pile capacity annexure */}
              <div className="card shadow-sm flex flex-col justify-between">
                <div>
                  <div className="card-title">🚧 Pile Capacity — Annexure VI</div>
                  <div className="overflow-x-auto mb-2 border border-border rounded">
                    <table className="dt" style={{ minWidth: "400px" }}>
                      <thead>
                        <tr>
                          <th>Sub-structure</th>
                          <th>Dia (m)</th>
                          <th>Len (m)</th>
                          <th>Self Wt</th>
                          <th>Tip RL</th>
                          <th>Axle (T)</th>
                          <th>Net Axle</th>
                          <th>Uplift (T)</th>
                          <th>Lateral (F)</th>
                          <th>Lateral (L)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="td-p">Abutment A-1</td>
                          <td className="font-mono text-amber-d">1.20</td>
                          <td>24.0</td>
                          <td>27.1</td>
                          <td>76.0m</td>
                          <td className="font-semibold text-green-700">399</td>
                          <td>372</td>
                          <td className="text-blue-700">293</td>
                          <td>22.5</td>
                          <td>36.8</td>
                        </tr>
                        <tr>
                          <td className="td-p">Abutment A-1</td>
                          <td className="font-mono text-amber-d">1.20</td>
                          <td>26.0</td>
                          <td>29.4</td>
                          <td>74.0m</td>
                          <td className="font-semibold text-green-700">463</td>
                          <td>434</td>
                          <td className="text-blue-700">347</td>
                          <td>24.2</td>
                          <td>38.9</td>
                        </tr>
                        <tr>
                          <td className="td-p">Abutment A-2</td>
                          <td className="font-mono text-amber-d">1.20</td>
                          <td>24.0</td>
                          <td>27.1</td>
                          <td>76.0m</td>
                          <td className="font-semibold text-green-700">402</td>
                          <td>375</td>
                          <td className="text-blue-700">295</td>
                          <td>22.6</td>
                          <td>36.9</td>
                        </tr>
                        <tr>
                          <td className="td-p">Pier P1</td>
                          <td className="font-mono text-amber-d">1.50</td>
                          <td>28.0</td>
                          <td>49.5</td>
                          <td>169.6m</td>
                          <td className="font-semibold text-green-700">685</td>
                          <td>636</td>
                          <td className="text-blue-700">482</td>
                          <td>35.4</td>
                          <td>54.2</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[9px] text-text-ter leading-relaxed">
                    pile capacities computed based on IS 2911 Pt 1 Sec 2 using static formula. Safe pile load values include skin friction and end bearing.
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn btn-p flex-1 py-1.5 cursor-pointer">Add Pile Dia</button>
                  <button className="btn btn-w flex-1 py-1.5 cursor-pointer">Recalculate Capacities</button>
                </div>
              </div>
            </div>

            {/* Liquefaction assessment & Graph */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Liquefaction card */}
              <div className="card shadow-sm">
                <div className="card-title">
                  <span>⚡ Liquefaction Assessment — IS 1893</span>
                  <select
                    className="bv-select font-mono text-[9px] py-0.5"
                    value={selectedReportBh}
                    onChange={(e) => setSelectedReportBh(e.target.value)}
                  >
                    {mappedBoreholes.filter(b => b.status === "COMPLETED").map((bh) => (
                      <option key={bh.id} value={bh.boreholeCode}>{bh.boreholeCode}</option>
                    ))}
                  </select>
                </div>
                <div className="ib ib-b py-2 mb-2">
                  {seismicZone} · PGA {pga}g · EQ Mw {earthquakeMag} · {selectedReportBh}
                </div>
                <div className="overflow-x-auto border border-border rounded">
                  <table className="dt">
                    <thead>
                      <tr>
                        <th>Depth</th>
                        <th>N1(60)</th>
                        <th>CSR</th>
                        <th>CRR</th>
                        <th>FS</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liquefactionData.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{item.depth}</td>
                          <td>{item.n160}</td>
                          <td>{item.csr}</td>
                          <td>{item.crr}</td>
                          <td className={`font-bold ${item.status === "Liquefiable" ? "text-red-500" : "text-green-d"}`}>
                            {item.fs}
                          </td>
                          <td>
                            <span className={`pill ${item.status === "Liquefiable" ? "p-red" : "p-g"}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="btn-row justify-end mt-2">
                  <button className="btn btn-p btn-sm cursor-pointer">Recalculate</button>
                  <button className="btn btn-w btn-sm">Export CSV</button>
                </div>
              </div>

              {/* SPT Nc vs Depth Graph */}
              <div className="card shadow-sm">
                <div className="card-title">📈 SPT N-value vs Depth</div>
                <div className="bg-bg-raised border border-border rounded-[7px] p-3">
                  <div className="h-[150px] bg-bg-card rounded border border-border flex items-center justify-center p-2 relative">
                    <svg width="100%" height="100%" viewBox="0 0 300 120">
                      {/* depth lines */}
                      <line x1="30" y1="10" x2="30" y2="110" stroke="#444" strokeWidth="0.5" />
                      <line x1="90" y1="10" x2="90" y2="110" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                      <line x1="150" y1="10" x2="150" y2="110" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                      <line x1="210" y1="10" x2="210" y2="110" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                      <line x1="270" y1="10" x2="270" y2="110" stroke="#444" strokeWidth="0.5" />

                      {/* vertical grid lines (depth logs) */}
                      <line x1="30" y1="10" x2="270" y2="10" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="30" y1="40" x2="270" y2="40" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="30" y1="70" x2="270" y2="70" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="30" y1="100" x2="270" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />

                      {/* plots for Nc values */}
                      <path
                        d="M 78,10 L 108,40 L 90,70 L 192,100"
                        fill="none"
                        stroke="var(--color-rust-mid)"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 72,10 L 90,40 L 102,70 L 140,100"
                        fill="none"
                        stroke="var(--color-green-d)"
                        strokeWidth="1.5"
                      />

                      {/* text ticks */}
                      <text x="25" y="118" fontSize="7" fill="#6B6966">0</text>
                      <text x="85" y="118" fontSize="7" fill="#6B6966">10</text>
                      <text x="145" y="118" fontSize="7" fill="#6B6966">20</text>
                      <text x="205" y="118" fontSize="7" fill="#6B6966">30</text>
                      <text x="265" y="118" fontSize="7" fill="#6B6966">40</text>

                      <text x="4" y="15" fontSize="6" fill="#888">0m</text>
                      <text x="4" y="45" fontSize="6" fill="#888">6m</text>
                      <text x="4" y="75" fontSize="6" fill="#888">12m</text>
                      <text x="4" y="105" fontSize="6" fill="#888">18m</text>
                    </svg>
                  </div>
                  <div className="flex gap-4 mt-2 text-[9px] text-text-ter justify-center">
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-rust-mid inline-block" /> A-01 Corrected N</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-green-d inline-block" /> A-02 Corrected N</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tamper Certificate Card */}
            <div className="card shadow-sm">
              <div className="card-title flex justify-between items-center">
                <span>🛡️ Groundlense Tamper-Evident Certificate</span>
                <button
                  onClick={() => setTamperCertGenerated(true)}
                  className="btn btn-s btn-sm cursor-pointer"
                  disabled={tamperCertGenerated}
                >
                  {tamperCertGenerated ? "✓ Generated" : "Generate Certificate"}
                </button>
              </div>
              <div className="rp-cert">
                <div className="rp-cert-t flex items-center gap-1">
                  <RiShieldCheckLine className="text-green-d" /> 
                  ✓ Tamper-Evident Hashing Active · GL-CERT-0047-001 · NABL {activeNablLab.code}
                </div>
                <div className="rp-cert-h">
                  SHA-256 Chain Root: <span className="font-mono text-text-pri">a3f8d2c771e8bb590b1c0eaef282a884f18399582dcb80e4619622d8e9c91e4b</span>
                </div>
                <div className="text-[9px] text-text-ter mt-1">
                  Borings covered: A-01, A-02, A-03 (validated under engineer block hashes). Certificates are cryptographic guarantees of raw field data source integrity.
                </div>
              </div>
              {tamperCertGenerated && (
                <div className="flex gap-2 mt-3 animate-fade-in">
                  <button className="btn btn-s btn-sm flex-1 flex justify-center items-center gap-1">
                    <RiDownloadLine /> Download Cryptographic PDF
                  </button>
                  <button className="btn btn-w btn-sm flex-1">Share Verification Link</button>
                </div>
              )}
            </div>

            {/* Report Preview card */}
            {reportGenerated && (
              <div className="report-preview-box animate-fade-in shadow-xl">
                <div className="rp-header">
                  <div className="rp-title">Geotechnical Investigation Report</div>
                  <div className="font-semibold text-[11px] text-[#333333] tracking-[0.5px] uppercase mt-1">IS 1892 Standard Boring Logs Summary</div>
                  <div className="rp-subtitle">Report No: GL-RP-0047-001 · Date: {new Date().toLocaleDateString("en-IN")}</div>
                </div>

                <div className="text-[10px] text-[#222] leading-relaxed mb-4">
                  <span className="font-bold">Project Name: </span> {proj.name} <br />
                  <span className="font-bold">Client Authority: </span> {proj.initiatedByCompany?.name} <br />
                  <span className="font-bold">EPC Contractor: </span> {proj.epcOrganization?.name} <br />
                  <span className="font-bold">Assigned NABL Laboratory: </span> {activeNablLab.name} (Accreditation No: {activeNablLab.code})
                </div>

                <div className="font-bold text-[9px] uppercase tracking-[0.5px] text-[#1A1918] mb-1">1.0 Boring Locations Summary Table</div>
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Borehole ID</th>
                      <th>Sub-structure</th>
                      <th>Easting</th>
                      <th>Northing</th>
                      <th>RL (m)</th>
                      <th>Water Table</th>
                      <th>Final Depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedBoreholes.filter(b => b.status === "COMPLETED").map((bh) => (
                      <tr key={bh.id}>
                        <td className="font-mono">{bh.boreholeCode}</td>
                        <td>{bh.name}</td>
                        <td>{bh.latitude}</td>
                        <td>{bh.longitude}</td>
                        <td>{bh.groundLevelRL.toFixed(3)}</td>
                        <td>{bh.waterTable ? `${bh.waterTable.toFixed(2)}m` : "—"}</td>
                        <td>{bh.finalDepth.toFixed(1)}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="font-bold text-[9px] uppercase tracking-[0.5px] text-[#1A1918] mt-4 mb-1">2.0 Corrected SPT Resistance Profiles</div>
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Borehole</th>
                      <th>Depth (m)</th>
                      <th>Soil Strata Description</th>
                      <th>Raw N-value</th>
                      <th>Corrected N-value</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-mono">GL-BH-0047-A-01</td>
                      <td>9.0-16.0m</td>
                      <td>Dense coarse sand</td>
                      <td>27</td>
                      <td>24</td>
                      <td>Safe foundation stratum</td>
                    </tr>
                    <tr>
                      <td className="font-mono">GL-BH-0047-A-03</td>
                      <td>7.5-9.0m</td>
                      <td>Clay (Disturbed)</td>
                      <td>42</td>
                      <td>16</td>
                      <td>Modified per IS 2131 Cl.6.3 (casing disturbance)</td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-[8px] text-[#6B6966] italic mt-4 border-t border-dashed pt-2">
                  This report has been compiled and validated cryptographically on the GroundLense platform.
                  It contains digital signature chains of the geotech engineer (GL-ENG-0142) and NABL lab technician (GL-L-0008).
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
