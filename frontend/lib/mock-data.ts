/* ============ DATA SERIES ============ */
export const ENROLL_SERIES = [320, 340, 380, 410, 460, 500, 540, 580];
export const PAY_SERIES = [80, 100, 110, 140, 160, 175, 180, 187];
export const PAYMENT_BARS = [42, 58, 71, 89, 124, 142, 168, 187];

/* ============ DEAL TYPES ============ */
export const DEAL_TYPES = [
  { key: "conversion", label: "Conversion", cls: "conversion" },
  { key: "followup", label: "Followup-Conversion", cls: "followup" },
  { key: "cold", label: "Cold Lead Enrollment", cls: "cold" },
  { key: "activation", label: "Activation", cls: "activation" },
  { key: "course-grad", label: "Course Graduation", cls: "course-grad" },
  { key: "grad-push", label: "Graduation Push", cls: "grad-push" },
  { key: "retention", label: "Retention", cls: "retention" },
] as const;

export type DealTypeKey = (typeof DEAL_TYPES)[number]["key"];

/* ============ LEARNERS ============ */
export interface Learner {
  name: string;
  email: string;
  phone: string;
  program: "FA" | "FLA";
  country: string;
  enrolled: string;
  paid: boolean;
  status: string;
  risk: boolean;
  lastContact: string;
  progress: number;
}

export const LEARNERS: Learner[] = [
  { name: "Amina Uwase", email: "amina@gmail.com", phone: "+250788001001", program: "FLA", country: "Rwanda", enrolled: "2026-02-14", paid: true, status: "Active", risk: false, lastContact: "2 days ago", progress: 2 },
  { name: "Jean-Pierre Nkurunziza", email: "jp@gmail.com", phone: "+250788001002", program: "FA", country: "Rwanda", enrolled: "2026-01-22", paid: false, status: "Enrolled Unpaid", risk: false, lastContact: "5 days ago", progress: 0 },
  { name: "Grace Mukamisha", email: "grace@gmail.com", phone: "+250782022866", program: "FLA", country: "Rwanda", enrolled: "2025-12-09", paid: true, status: "Pending Graduation", risk: false, lastContact: "1 day ago", progress: 3 },
  { name: "Abel Ahishakiye", email: "abel@gmail.com", phone: "+250792424685", program: "FLA", country: "Rwanda", enrolled: "2026-03-01", paid: true, status: "Active", risk: false, lastContact: "3 hours ago", progress: 1 },
  { name: "Divine Abijuru", email: "divine@gmail.com", phone: "+250780101127", program: "FA", country: "Rwanda", enrolled: "2026-01-30", paid: true, status: "Payment at Risk", risk: true, lastContact: "8 days ago", progress: 1 },
  { name: "Johanna Adotey", email: "johanna@gmail.com", phone: "+250792400308", program: "FLA", country: "Ghana", enrolled: "2025-11-18", paid: true, status: "Graduate", risk: false, lastContact: "3 weeks ago", progress: 4 },
  { name: "Hussein Mussa", email: "hussein@gmail.com", phone: "+255618189414", program: "FA", country: "Tanzania", enrolled: "2026-02-02", paid: true, status: "Active", risk: false, lastContact: "6 hours ago", progress: 2 },
  { name: "Adeodatus Nkundana", email: "adeo@alustudent.com", phone: "+250783508083", program: "FLA", country: "Rwanda", enrolled: "2026-03-12", paid: false, status: "Cold Lead", risk: false, lastContact: "12 days ago", progress: 0 },
  { name: "Hijo Abayo", email: "hijo@gmail.com", phone: "+250786814699", program: "FA", country: "Rwanda", enrolled: "2026-02-20", paid: false, status: "Cold Lead", risk: false, lastContact: "4 days ago", progress: 0 },
  { name: "Rahmaan Abdu", email: "rahmaan@gmail.com", phone: "+255617372920", program: "FLA", country: "Tanzania", enrolled: "2026-01-05", paid: true, status: "Pending Graduation", risk: false, lastContact: "2 days ago", progress: 3 },
  { name: "Esther Iradukunda", email: "esther.i@gmail.com", phone: "+250788445223", program: "FA", country: "Rwanda", enrolled: "2026-03-08", paid: true, status: "Active", risk: false, lastContact: "1 day ago", progress: 2 },
  { name: "Patrick Niyongira", email: "patrickn@gmail.com", phone: "+250788332019", program: "FLA", country: "Rwanda", enrolled: "2025-10-22", paid: true, status: "Graduate", risk: false, lastContact: "1 month ago", progress: 4 },
  { name: "Aline Iribagiza", email: "alinei@gmail.com", phone: "+250788992014", program: "FLA", country: "Rwanda", enrolled: "2026-02-28", paid: false, status: "Cold Lead", risk: false, lastContact: "6 days ago", progress: 0 },
  { name: "Sostene Bizimana", email: "sostene@gmail.com", phone: "+250788121553", program: "FA", country: "Rwanda", enrolled: "2026-01-14", paid: true, status: "Payment at Risk", risk: true, lastContact: "10 days ago", progress: 1 },
];

/* ============ AGENTS / AMBASSADORS ============ */
export const AGENTS_DATA = [
  { name: "Kalisa Eric", attempted: 38, success: 23, rate: 0.61, value: 11500, trend: [2, 4, 3, 5, 4, 6, 7], assigned: 30 },
  { name: "Uwimana Claire", attempted: 34, success: 21, rate: 0.62, value: 10500, trend: [1, 3, 3, 4, 4, 5, 5], assigned: 28 },
  { name: "Ndayishimiye Paul", attempted: 30, success: 17, rate: 0.57, value: 8500, trend: [2, 2, 3, 3, 4, 4, 4], assigned: 25 },
  { name: "Mukiza Sandrine", attempted: 28, success: 15, rate: 0.54, value: 7500, trend: [1, 2, 3, 2, 3, 3, 4], assigned: 25 },
  { name: "Habimana James", attempted: 26, success: 13, rate: 0.50, value: 6500, trend: [2, 3, 2, 3, 2, 3, 3], assigned: 22 },
  { name: "Ingabire Solange", attempted: 24, success: 11, rate: 0.46, value: 5500, trend: [1, 1, 2, 2, 2, 3, 3], assigned: 20 },
  { name: "Nkusi David", attempted: 22, success: 9, rate: 0.41, value: 4500, trend: [1, 2, 1, 2, 1, 2, 2], assigned: 18 },
  { name: "Uwineza Marie", attempted: 20, success: 7, rate: 0.35, value: 3500, trend: [2, 1, 1, 2, 1, 1, 2], assigned: 15 },
];

export const AMBASSADORS_DATA = [
  { name: "Diane Mutesi", attempted: 22, success: 9, events: 3, attendance: 48, reach: 140 },
  { name: "Pierre Hakizimana", attempted: 18, success: 7, events: 2, attendance: 34, reach: 88 },
  { name: "Sarah Nyiransengimana", attempted: 14, success: 5, events: 2, attendance: 26, reach: 62 },
];

/* ============ PARTNERSHIPS ============ */
export const PARTNERSHIPS = [
  { org: "Umurava", contact: "Liliane K.", program: "FA", value: 800000, stage: "Active", last: "2 days ago", next: "2026-05-22" },
  { org: "Jasiri", contact: "Yves M.", program: "FA", value: 2000000, stage: "Prospect", last: "5 days ago", next: "2026-05-19" },
  { org: "BNR", contact: "Aimable N.", program: "FLA", value: 500000, stage: "At Risk", last: "12 days ago", next: "2026-05-20" },
  { org: "Mastery Hub", contact: "Sarah T.", program: "FLA", value: 400000, stage: "Active", last: "4 days ago", next: "2026-06-01" },
  { org: "Kepler", contact: "Eric U.", program: "FA", value: 600000, stage: "Active", last: "1 day ago", next: "2026-05-25" },
  { org: "4D Metrics", contact: "Olivier S.", program: "FLA", value: 200000, stage: "No Signs of Life", last: "42 days ago", next: "—" },
  { org: "RDB", contact: "Bernadette G.", program: "FA", value: 5000000, stage: "Prospect", last: "6 days ago", next: "2026-05-21" },
  { org: "ICT Chamber", contact: "Patience B.", program: "FA", value: 300000, stage: "Active", last: "3 days ago", next: "2026-06-08" },
];

/* ============ DEAL ACTIVITY ============ */
export const RECENT_DEALS: Array<{
  agent: string;
  learner: string;
  email: string;
  phone: string;
  type: DealTypeKey;
  outcome: "Success" | "Pending" | "Rejected";
  ago: string;
}> = [
  { agent: "Kalisa Eric", learner: "Amina Uwase", email: "amina@gmail.com", phone: "+250788001001", type: "activation", outcome: "Success", ago: "3m ago" },
  { agent: "Uwimana Claire", learner: "Hijo Abayo", email: "hijo@gmail.com", phone: "+250786814699", type: "conversion", outcome: "Success", ago: "8m ago" },
  { agent: "Ndayishimiye Paul", learner: "Divine Abijuru", email: "divine@gmail.com", phone: "+250780101127", type: "retention", outcome: "Pending", ago: "14m ago" },
  { agent: "Mukiza Sandrine", learner: "Grace Mukamisha", email: "grace@gmail.com", phone: "+250782022866", type: "grad-push", outcome: "Success", ago: "22m ago" },
  { agent: "Habimana James", learner: "Rahmaan Abdu", email: "rahmaan@gmail.com", phone: "+255617372920", type: "course-grad", outcome: "Success", ago: "31m ago" },
  { agent: "Kalisa Eric", learner: "Aline Iribagiza", email: "alinei@gmail.com", phone: "+250788992014", type: "conversion", outcome: "Rejected", ago: "45m ago" },
  { agent: "Ingabire Solange", learner: "Adeodatus Nkundana", email: "adeo@alustudent.com", phone: "+250783508083", type: "followup", outcome: "Pending", ago: "1h ago" },
  { agent: "Uwineza Marie", learner: "Sostene Bizimana", email: "sostene@gmail.com", phone: "+250788121553", type: "retention", outcome: "Pending", ago: "1h ago" },
];

/* ============ PENDING APPROVALS ============ */
export interface PendingApproval {
  agent: string;
  learner: string;
  program: "FA" | "FLA";
  type: DealTypeKey;
  outcome: string;
  ago: string;
  course?: string;
  deliverablesDone?: string[];
}

export const PENDING_APPROVALS_BASE: PendingApproval[] = [
  { agent: "Kalisa Eric", learner: "Amina Uwase", program: "FLA", type: "activation", outcome: "Submitted", ago: "3m", course: "Welcome to ALX", deliverablesDone: ["ALX Community Guidelines Quiz", "Profile Photo Upload", "Introduction Post Submission"] },
  { agent: "Uwimana Claire", learner: "Hijo Abayo", program: "FA", type: "conversion", outcome: "Paid", ago: "8m" },
  { agent: "Mukiza Sandrine", learner: "Grace Mukamisha", program: "FLA", type: "grad-push", outcome: "Graduated", ago: "22m", course: "FLA-2: Getting Your First Client", deliverablesDone: ["Outreach Tracker Submission", "Client Pitch Recording"] },
  { agent: "Habimana James", learner: "Rahmaan Abdu", program: "FLA", type: "course-grad", outcome: "Graduated", ago: "31m", course: "FLA-1: Building Your Freelance Foundation", deliverablesDone: ["Freelancer Profile Submission", "Niche Selection Document", "First Proposal Draft"] },
  { agent: "Ndayishimiye Paul", learner: "Patrick Niyongira", program: "FLA", type: "course-grad", outcome: "Graduated", ago: "42m", course: "FLA-2: Getting Your First Client", deliverablesDone: ["Outreach Tracker Submission", "Client Pitch Recording", "First Contract Draft"] },
  { agent: "Kalisa Eric", learner: "Esther Iradukunda", program: "FA", type: "activation", outcome: "Submitted", ago: "58m", course: "Business Foundations", deliverablesDone: ["Business Model Canvas"] },
  { agent: "Ingabire Solange", learner: "Aline Iribagiza", program: "FLA", type: "conversion", outcome: "Paid", ago: "1h" },
  { agent: "Uwineza Marie", learner: "Adeodatus Nkundana", program: "FLA", type: "activation", outcome: "Submitted", ago: "1h", course: "Welcome to ALX", deliverablesDone: ["ALX Community Guidelines Quiz", "Profile Photo Upload", "Introduction Post Submission"] },
  { agent: "Habimana James", learner: "Hussein Mussa", program: "FA", type: "activation", outcome: "Submitted", ago: "2h", course: "Business Foundations", deliverablesDone: ["Business Model Canvas", "Problem Statement Document"] },
  { agent: "Nkusi David", learner: "Abel Ahishakiye", program: "FLA", type: "activation", outcome: "Submitted", ago: "2h", course: "Welcome to ALX", deliverablesDone: ["ALX Community Guidelines Quiz", "Profile Photo Upload"] },
  { agent: "Kalisa Eric", learner: "Johanna Adotey", program: "FLA", type: "course-grad", outcome: "Graduated", ago: "3h", course: "FLA-2: Getting Your First Client", deliverablesDone: ["Outreach Tracker Submission", "Client Pitch Recording", "First Contract Draft"] },
  { agent: "Uwimana Claire", learner: "Jean-Pierre Nkurunziza", program: "FA", type: "conversion", outcome: "Paid", ago: "3h" },
];

/* ============ TARGETS ============ */
export const TARGETS_BASE = [
  { key: "enroll", name: "Enrollments", current: 4821, target: 13000, unit: "" },
  { key: "pay", name: "Payments", current: 187, target: 600, unit: "" },
  { key: "conv", name: "Conversion Rate", current: 38, target: 60, unit: "%" },
  { key: "act", name: "Activation Rate", current: 61, target: 90, unit: "%" },
  { key: "ret", name: "Retention Rate", current: 58, target: 80, unit: "%" },
  { key: "gradPaid", name: "Graduation Rate (paid)", current: 42, target: 70, unit: "%" },
  { key: "gradAct", name: "Graduation Rate (activated)", current: 51, target: 80, unit: "%" },
  { key: "partnership", name: "Partnership Value", current: 1200000, target: 16700000, unit: "RWF" },
];

/* ============ ALERTS ============ */
export const ALERTS_BASE = [
  { metric: "Conversion Rate", current: "38%", target: "60%", gap: "-22pp", severity: "Critical", time: "4 min ago", screen: "targets" },
  { metric: "Partnership Value", current: "RWF 1.2M", target: "RWF 16.7M", gap: "-93%", severity: "Critical", time: "10 min ago", screen: "partnerships" },
  { metric: "Retention Rate", current: "58%", target: "80%", gap: "-22pp", severity: "Warning", time: "32 min ago", screen: "targets" },
  { metric: "Activation Rate", current: "61%", target: "90%", gap: "-29pp", severity: "Warning", time: "1 hour ago", screen: "targets" },
  { metric: "Graduation (paid)", current: "42%", target: "70%", gap: "-28pp", severity: "Warning", time: "2 hours ago", screen: "targets" },
  { metric: "At-Risk Partnerships", current: "2", target: "0", gap: "+2", severity: "Watch", time: "3 hours ago", screen: "partnerships" },
];

/* ============ PROGRAMS / COURSES / DELIVERABLES ============ */
export interface Deliverable { seq: number; name: string; desc: string }
export interface Course { seq: number; name: string; desc: string; deliverables: Deliverable[] }
export interface Program {
  code: "FA" | "FLA";
  name: string;
  desc: string;
  totalCourses: number;
  learners: number;
  created: string;
  active: boolean;
  courses: Course[];
}

export const PROGRAMS_BASE: Program[] = [
  {
    code: "FA",
    name: "Founders Academy",
    desc: "Founder-track program: build a startup from idea to fundraising.",
    totalCourses: 4,
    learners: 1842,
    created: "2024-09-01",
    active: true,
    courses: [
      { seq: 1, name: "Business Foundations", desc: "Validate idea, business models, MVP shaping.", deliverables: [
        { seq: 1, name: "Business Model Canvas", desc: "Complete the BMC template covering customer segments, value props, and revenue streams." },
        { seq: 2, name: "Problem Statement Document", desc: "Two-page brief outlining the validated problem and target user." },
      ]},
      { seq: 2, name: "Product Development", desc: "From prototype to production-ready product.", deliverables: [
        { seq: 1, name: "MVP Feature List", desc: "Prioritised list of features for the v1 build." },
        { seq: 2, name: "Wireframe Submission", desc: "Hand-drawn or digital wireframes for the core user flow." },
      ]},
      { seq: 3, name: "Go-To-Market Strategy", desc: "Marketing, sales, growth loops.", deliverables: [
        { seq: 1, name: "GTM Plan Document", desc: "Channel mix, positioning, and 90-day launch plan." },
        { seq: 2, name: "Competitor Analysis", desc: "Side-by-side comparison of three direct competitors." },
      ]},
      { seq: 4, name: "Fundraising and Scaling", desc: "Investor pitch, dilution, scaling org.", deliverables: [
        { seq: 1, name: "Pitch Deck Submission", desc: "10-slide investor pitch deck with traction slide." },
        { seq: 2, name: "Financial Projections Sheet", desc: "3-year revenue, burn, and runway projection." },
      ]},
    ],
  },
  {
    code: "FLA",
    name: "Freelancer Academy",
    desc: "Career-track for new freelancers: from foundation to first paid client.",
    totalCourses: 3,
    learners: 2979,
    created: "2024-06-15",
    active: true,
    courses: [
      { seq: 1, name: "Welcome to ALX", desc: "Onboarding, accountability, learning system.", deliverables: [
        { seq: 1, name: "ALX Community Guidelines Quiz", desc: "Pass the community conduct and code of honour quiz." },
        { seq: 2, name: "Profile Photo Upload", desc: "Upload a clear headshot to the ALX profile." },
        { seq: 3, name: "Introduction Post Submission", desc: "Post a 100-word intro in the cohort channel." },
      ]},
      { seq: 2, name: "FLA-1: Building Your Freelance Foundation", desc: "Niche, brand, portfolio.", deliverables: [
        { seq: 1, name: "Freelancer Profile Submission", desc: "Polished freelancer profile on the chosen marketplace." },
        { seq: 2, name: "Niche Selection Document", desc: "One-page rationale for chosen niche and ICP." },
        { seq: 3, name: "First Proposal Draft", desc: "Draft proposal targeting a real prospect in the niche." },
      ]},
      { seq: 3, name: "FLA-2: Getting Your First Client", desc: "Cold outreach, proposals, closing.", deliverables: [
        { seq: 1, name: "Outreach Tracker Submission", desc: "Spreadsheet logging 20+ outreach attempts and statuses." },
        { seq: 2, name: "Client Pitch Recording", desc: "2-minute recorded pitch to a real or mock client." },
        { seq: 3, name: "First Contract Draft", desc: "Drafted scope-of-work and payment terms ready to send." },
      ]},
    ],
  },
];

/* ============ NUDGE TEMPLATES ============ */
export interface NudgeTemplate {
  name: string;
  type: DealTypeKey;
  body: string;
  active: boolean;
  scope?: { program: string; course: string; deliverable: string };
}

export const NUDGE_TEMPLATES_BASE: NudgeTemplate[] = [
  { name: "Payment reminder — friendly", type: "conversion", body: "Hi {name}, just checking in on your ALX enrolment payment. Are there any blockers we can help unblock today? — Team ALX Rwanda", active: true },
  { name: "Payment reminder — urgent", type: "conversion", body: "Hi {name}, today is the last day to lock your seat in the {program} cohort. Tap to complete payment: {link}", active: true },
  { name: "Followup nudge — 48h", type: "followup", body: "Hi {name}, following up on our last conversation. What questions can I answer about {program}?", active: true },
  { name: "Activation reminder", type: "activation", body: "Hi {name}, your first deliverable for {program} is due. Block 30 minutes today to knock it out!", active: true },
  { name: "Profile photo nudge", type: "activation", scope: { program: "FLA", course: "Welcome to ALX", deliverable: "Profile Photo Upload" }, body: "Hi {name}, all that's left for Welcome to ALX is uploading your profile photo. Takes 1 minute — go!", active: true },
  { name: "BMC submission reminder", type: "activation", scope: { program: "FA", course: "Business Foundations", deliverable: "Business Model Canvas" }, body: "Hi {name}, your Business Model Canvas is the last block for FA-1. Need help filling any quadrant?", active: true },
  { name: "Course graduation", type: "course-grad", body: "Hi {name}, you're 1 deliverable away from completing {course}. Submit by Friday to graduate this milestone.", active: true },
  { name: "Pitch recording reminder", type: "course-grad", scope: { program: "FLA", course: "FLA-2: Getting Your First Client", deliverable: "Client Pitch Recording" }, body: "Hi {name}, the 2-minute pitch recording is the last deliverable for FLA-2. You've got this — record one take today.", active: true },
  { name: "Graduation push — final", type: "grad-push", body: "Hi {name}, your capstone is the last step. We've blocked a slot to review it together — pick a time.", active: false },
  { name: "Retention — re-engage", type: "retention", body: "Hi {name}, we noticed it's been a moment. Anything we can help with on your {program} journey?", active: true },
];

/* ============ USERS ============ */
export const USERS_BASE = [
  { name: "Emmanuel Mugabo", email: "emmanuel@alxafrica.com", role: "Admin", active: true, last: "Today, 06:48" },
  { name: "Kalisa Eric", email: "kalisa@alxafrica.com", role: "Agent", active: true, last: "Today, 07:02" },
  { name: "Uwimana Claire", email: "uwimana@alxafrica.com", role: "Agent", active: true, last: "Today, 06:55" },
  { name: "Ndayishimiye Paul", email: "paul@alxafrica.com", role: "Agent", active: true, last: "Yesterday, 18:22" },
  { name: "Mukiza Sandrine", email: "sandrine@alxafrica.com", role: "Agent", active: true, last: "Today, 07:05" },
  { name: "Habimana James", email: "james@alxafrica.com", role: "Agent", active: true, last: "Today, 07:14" },
  { name: "Ingabire Solange", email: "solange@alxafrica.com", role: "Agent", active: false, last: "3 days ago" },
  { name: "Nkusi David", email: "david@alxafrica.com", role: "Agent", active: true, last: "Today, 06:38" },
  { name: "Uwineza Marie", email: "marie@alxafrica.com", role: "Agent", active: true, last: "Today, 07:11" },
  { name: "Diane Mutesi", email: "diane@alxafrica.com", role: "Ambassador", active: true, last: "Today, 06:50" },
  { name: "Pierre Hakizimana", email: "pierre@alxafrica.com", role: "Ambassador", active: true, last: "Yesterday, 20:01" },
  { name: "Sarah Nyiransengimana", email: "sarahn@alxafrica.com", role: "Ambassador", active: true, last: "Today, 07:08" },
];

/* ============ SETTINGS ============ */
export const SETTINGS_BASE = {
  org: "ALX Rwanda",
  defaultProgram: "FLA",
  workingDays: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true },
  dealCap: 30,
  followupCap: 35,
  alertThreshold: 10,
  timezone: "Africa/Kigali",
};

/* ============ EVENTS ============ */
export const EVENTS_BASE = [
  { name: "FLA Open House — Kigali", location: "Norrsken House", date: "2026-05-22", expected: 60, actual: null as number | null, status: "Upcoming", link: "https://lu.ma/fla-open" },
  { name: "Founders Mixer — Huye", location: "Huye Innovation Hub", date: "2026-05-12", expected: 40, actual: 38, status: "Completed", link: "https://lu.ma/founders-mixer" },
  { name: "FLA Demo Day — Online", location: "Zoom", date: "2026-04-28", expected: 120, actual: 104, status: "Completed", link: "https://zoom.us/demo" },
  { name: "Career Day — UR Huye", location: "UR Huye Campus", date: "2026-06-04", expected: 80, actual: null, status: "Upcoming", link: "https://lu.ma/career-day" },
  { name: "Ambassador Townhall", location: "ALX Hub Kacyiru", date: "2026-04-15", expected: 30, actual: 28, status: "Completed", link: "" },
  { name: "FA Investor Pitch Night", location: "Norrsken House", date: "2026-06-18", expected: 50, actual: null, status: "Upcoming", link: "https://lu.ma/pitch" },
];

/* ============ DEAL REPORTS ============ */
export const PAYMENT_BARRIERS = [
  { key: "financial", label: "Financial reasons", color: "#DC3545" },
  { key: "value", label: "Value not convincing", color: "#D97706" },
  { key: "time", label: "Time and commitment", color: "#3B7DD8" },
  { key: "system", label: "System friction", color: "#8E5CC1" },
  { key: "delay", label: "Decision delay", color: "#00A896" },
  { key: "comms", label: "Communication gaps", color: "#5A6478" },
  { key: "external", label: "External events", color: "#059669" },
  { key: "trust", label: "Trust issues", color: "#E55934" },
  { key: "offer", label: "Offer not compelling", color: "#3A7C8A" },
];

export const SUBMISSION_BARRIERS = [
  { key: "time", label: "Time constraints", color: "#3B7DD8" },
  { key: "clarity", label: "Lack of clarity", color: "#D97706" },
  { key: "confidence", label: "Confidence barriers", color: "#DC3545" },
  { key: "platform", label: "Platform/technical friction", color: "#8E5CC1" },
  { key: "value", label: "Low perceived value", color: "#5A6478" },
  { key: "procrast", label: "Procrastination / delay", color: "#00A896" },
  { key: "support", label: "Lack of support", color: "#E55934" },
  { key: "comms", label: "Communication gaps", color: "#3A7C8A" },
  { key: "external", label: "External constraints", color: "#059669" },
  { key: "complex", label: "Process complexity", color: "#B2548F" },
];

export const PAYMENT_REPORTS = [
  { date: "2026-05-17", agent: "Kalisa Eric", learner: "Divine Abijuru", reason: "financial", followup: "2026-05-22", comment: "Says she can pay next month after salary. Confirmed real interest, soft commit to pay May 31." },
  { date: "2026-05-17", agent: "Uwimana Claire", learner: "Jean-Pierre Nkurunziza", reason: "value", followup: "2026-05-21", comment: "Asked too many questions about ROI. Sent program success stories." },
  { date: "2026-05-16", agent: "Ndayishimiye Paul", learner: "Sostene Bizimana", reason: "financial", followup: "2026-05-23", comment: "Pending external funding decision. Will know by Friday." },
  { date: "2026-05-16", agent: "Mukiza Sandrine", learner: "Aline Iribagiza", reason: "delay", followup: "2026-05-20", comment: "Needs to discuss with family before committing." },
  { date: "2026-05-15", agent: "Habimana James", learner: "Hijo Abayo", reason: "time", followup: "2026-05-22", comment: "Busy period at his current job, asked to pause until June." },
  { date: "2026-05-15", agent: "Ingabire Solange", learner: "Adeodatus Nkundana", reason: "system", followup: "2026-05-19", comment: "Confused by the payment flow on the portal. Walked him through but he didn't complete." },
  { date: "2026-05-14", agent: "Nkusi David", learner: "Patrick Niyongira", reason: "trust", followup: "2026-05-21", comment: "Concerns about refund policy. Sent the official policy doc." },
  { date: "2026-05-14", agent: "Uwineza Marie", learner: "Esther Iradukunda", reason: "external", followup: "2026-05-25", comment: "Family emergency this week. Reconnecting next Monday." },
  { date: "2026-05-13", agent: "Kalisa Eric", learner: "Grace Mukamisha", reason: "comms", followup: "2026-05-19", comment: "Missed earlier reminders due to WhatsApp blocks. Resolved." },
  { date: "2026-05-13", agent: "Uwimana Claire", learner: "Amina Uwase", reason: "value", followup: "2026-05-20", comment: "Wanted clearer breakdown of curriculum vs cost." },
  { date: "2026-05-12", agent: "Mukiza Sandrine", learner: "Hussein Mussa", reason: "offer", followup: "2026-05-19", comment: "Asked for installment payment option. Forwarded to ops." },
  { date: "2026-05-11", agent: "Habimana James", learner: "Johanna Adotey", reason: "financial", followup: "—", comment: "Lost income, deferring to next intake." },
];

export const SUBMISSION_REPORTS = [
  { date: "2026-05-17", agent: "Kalisa Eric", learner: "Abel Ahishakiye", course: "FLA-1", reason: "time", followup: "2026-05-21", comment: "Picked up extra shifts last week, will catch up over weekend." },
  { date: "2026-05-17", agent: "Mukiza Sandrine", learner: "Esther Iradukunda", course: "FA-2", reason: "clarity", followup: "2026-05-20", comment: "Confused by what 'business model canvas' actually wants. Resent the example template." },
  { date: "2026-05-16", agent: "Ndayishimiye Paul", learner: "Amina Uwase", course: "FLA-2", reason: "confidence", followup: "2026-05-22", comment: "Worried her portfolio isn't good enough to submit. Reassured her." },
  { date: "2026-05-16", agent: "Uwimana Claire", learner: "Hussein Mussa", course: "FA-2", reason: "procrast", followup: "2026-05-20", comment: "Knows what to do, just hasn't started. Set a Saturday checkpoint." },
  { date: "2026-05-15", agent: "Habimana James", learner: "Rahmaan Abdu", course: "FLA-2", reason: "platform", followup: "2026-05-19", comment: "Internet at home is unstable, can't upload large file. Sharing campus wifi info." },
  { date: "2026-05-15", agent: "Ingabire Solange", learner: "Grace Mukamisha", course: "FLA-3", reason: "value", followup: "2026-05-21", comment: "Already has clients, sees the deliverable as redundant. Explained graduation requirement." },
  { date: "2026-05-14", agent: "Nkusi David", learner: "Patrick Niyongira", course: "FLA-3", reason: "complex", followup: "2026-05-22", comment: "Too many sub-steps in this milestone. Helped break it down into 3 chunks." },
  { date: "2026-05-14", agent: "Uwineza Marie", learner: "Adeodatus Nkundana", course: "Welcome", reason: "support", followup: "2026-05-20", comment: "Hasn't found his cohort group. Connected him to a peer." },
  { date: "2026-05-13", agent: "Kalisa Eric", learner: "Hijo Abayo", course: "FA-1", reason: "external", followup: "2026-05-23", comment: "Health issue, doctor advised rest for a week." },
  { date: "2026-05-13", agent: "Uwimana Claire", learner: "Divine Abijuru", course: "FA-1", reason: "comms", followup: "2026-05-19", comment: "Missed the reminders during exam season. Schedule recovery plan." },
  { date: "2026-05-12", agent: "Mukiza Sandrine", learner: "Jean-Pierre Nkurunziza", course: "FA-1", reason: "clarity", followup: "2026-05-20", comment: "Doesn't understand what 'value proposition' means in this context." },
  { date: "2026-05-11", agent: "Habimana James", learner: "Aline Iribagiza", course: "Welcome", reason: "procrast", followup: "2026-05-21", comment: "Just hasn't started yet. Booked a 30-min coworking session for Sat." },
];

/* ============ DASHBOARD HELPER DATA ============ */
export const PENDING_APPROVALS_DASHBOARD = [
  { agent: "Kalisa Eric", learner: "Amina Uwase", program: "FLA", type: "activation" as const },
  { agent: "Uwimana Claire", learner: "Hijo Abayo", program: "FA", type: "conversion" as const },
  { agent: "Mukiza Sandrine", learner: "Grace Mukamisha", program: "FLA", type: "grad-push" as const },
];

export const AT_RISK_METRICS = [
  { n: "Conversion Rate", v: "38% vs 60%", s: "red" as const },
  { n: "Retention Rate", v: "58% vs 80%", s: "amber" as const },
  { n: "Grad Rate (paid)", v: "42% vs 70%", s: "amber" as const },
  { n: "Partnership Value", v: "RWF 1.2M vs 16.7M", s: "red" as const },
];

/* ============ AGENT / AMBASSADOR QUEUES ============ */
export interface QueueDeal {
  rank: number;
  learner: string;
  phone: string;
  program: "FA" | "FLA";
  type: DealTypeKey;
  last: string;
}

export const AGENT_QUEUE_BASE: QueueDeal[] = [
  { rank: 1, learner: "Divine Abijuru", phone: "+250780101127", program: "FA", type: "retention", last: "8 days ago" },
  { rank: 2, learner: "Sostene Bizimana", phone: "+250788121553", program: "FA", type: "retention", last: "10 days ago" },
  { rank: 3, learner: "Adeodatus Nkundana", phone: "+250783508083", program: "FLA", type: "conversion", last: "12 days ago" },
  { rank: 4, learner: "Hijo Abayo", phone: "+250786814699", program: "FA", type: "conversion", last: "4 days ago" },
  { rank: 5, learner: "Aline Iribagiza", phone: "+250788992014", program: "FLA", type: "conversion", last: "6 days ago" },
  { rank: 6, learner: "Abel Ahishakiye", phone: "+250792424685", program: "FLA", type: "activation", last: "3 hours ago" },
  { rank: 7, learner: "Esther Iradukunda", phone: "+250788445223", program: "FA", type: "activation", last: "1 day ago" },
  { rank: 8, learner: "Grace Mukamisha", phone: "+250782022866", program: "FLA", type: "grad-push", last: "1 day ago" },
  { rank: 9, learner: "Rahmaan Abdu", phone: "+255617372920", program: "FLA", type: "course-grad", last: "2 days ago" },
  { rank: 10, learner: "Jean-Pierre Nkurunziza", phone: "+250788001002", program: "FA", type: "followup", last: "5 days ago" },
];

export const AMB_QUEUE_BASE: QueueDeal[] = [
  { rank: 1, learner: "Adeodatus Nkundana", phone: "+250783508083", program: "FLA", type: "conversion", last: "12 days ago" },
  { rank: 2, learner: "Hijo Abayo", phone: "+250786814699", program: "FA", type: "cold", last: "4 days ago" },
  { rank: 3, learner: "Aline Iribagiza", phone: "+250788992014", program: "FLA", type: "conversion", last: "6 days ago" },
  { rank: 4, learner: "Jean-Pierre Nkurunziza", phone: "+250788001002", program: "FA", type: "followup", last: "5 days ago" },
  { rank: 5, learner: "Patrick Niyongira", phone: "+250788332019", program: "FLA", type: "cold", last: "3 days ago" },
  { rank: 6, learner: "Sostene Bizimana", phone: "+250788121553", program: "FA", type: "conversion", last: "10 days ago" },
];

/* ============ AGENT HISTORY ============ */
export interface AgentHistoryRow {
  date: string;
  learner: string;
  type: DealTypeKey;
  outcome: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Logged";
  value: number;
  program?: "FA" | "FLA";
  course?: string;
  deliverablesDone?: string[];
}

export const AGENT_DEAL_HISTORY: AgentHistoryRow[] = [
  { date: "2026-05-17", learner: "Amina Uwase", type: "activation", outcome: "Submitted", reason: "", status: "Pending", value: 300, program: "FLA", course: "Welcome to ALX", deliverablesDone: ["ALX Community Guidelines Quiz", "Profile Photo Upload", "Introduction Post Submission"] },
  { date: "2026-05-17", learner: "Hijo Abayo", type: "conversion", outcome: "Paid", reason: "", status: "Approved", value: 500 },
  { date: "2026-05-16", learner: "Divine Abijuru", type: "retention", outcome: "No", reason: "Financial constraints", status: "Logged", value: 0 },
  { date: "2026-05-16", learner: "Aline Iribagiza", type: "conversion", outcome: "Paid", reason: "", status: "Rejected", value: 0 },
  { date: "2026-05-15", learner: "Esther Iradukunda", type: "activation", outcome: "Submitted", reason: "", status: "Approved", value: 300, program: "FA", course: "Business Foundations", deliverablesDone: ["Business Model Canvas", "Problem Statement Document"] },
  { date: "2026-05-14", learner: "Adeodatus Nkundana", type: "followup", outcome: "No", reason: "Decision delay", status: "Logged", value: 0 },
  { date: "2026-05-14", learner: "Rahmaan Abdu", type: "course-grad", outcome: "Yes", reason: "", status: "Approved", value: 500, program: "FLA", course: "FLA-1: Building Your Freelance Foundation", deliverablesDone: ["Freelancer Profile Submission", "Niche Selection Document", "First Proposal Draft"] },
  { date: "2026-05-13", learner: "Grace Mukamisha", type: "grad-push", outcome: "No", reason: "Stuck on capstone", status: "Logged", value: 0, program: "FLA", course: "FLA-2: Getting Your First Client", deliverablesDone: ["Outreach Tracker Submission"] },
  { date: "2026-05-13", learner: "Sostene Bizimana", type: "retention", outcome: "Yes", reason: "", status: "Approved", value: 500 },
  { date: "2026-05-12", learner: "Patrick Niyongira", type: "course-grad", outcome: "Yes", reason: "", status: "Approved", value: 500, program: "FLA", course: "FLA-2: Getting Your First Client", deliverablesDone: ["Outreach Tracker Submission", "Client Pitch Recording", "First Contract Draft"] },
];

/* ============ VALUE LEDGER ============ */
export interface ValueRow {
  date: string;
  learner: string;
  type: DealTypeKey;
  event: string;
  value: number;
  status: string;
}

export const VALUE_BREAKDOWN: ValueRow[] = [
  { date: "2026-05-17", learner: "Hijo Abayo", type: "conversion", event: "Enrolled to Paid", value: 500, status: "Approved" },
  { date: "2026-05-15", learner: "Esther Iradukunda", type: "activation", event: "Activation", value: 300, status: "Approved" },
  { date: "2026-05-14", learner: "Rahmaan Abdu", type: "course-grad", event: "Course Graduation", value: 500, status: "Approved" },
  { date: "2026-05-13", learner: "Sostene Bizimana", type: "retention", event: "Retention", value: 500, status: "Approved" },
  { date: "2026-05-12", learner: "Patrick Niyongira", type: "course-grad", event: "Course Graduation", value: 500, status: "Approved" },
  { date: "2026-05-08", learner: "Johanna Adotey", type: "grad-push", event: "Program Graduation", value: 1500, status: "Approved" },
  { date: "2026-05-06", learner: "Amina Uwase", type: "conversion", event: "Enrolled to Paid", value: 500, status: "Approved" },
  { date: "2026-04-29", learner: "Patrick Niyongira", type: "grad-push", event: "Program Graduation", value: 1500, status: "Approved" },
];

/* ============ HELPERS ============ */
const AVATAR_COLORS = [
  "#3B7DD8", "#00A896", "#D97706", "#8E5CC1",
  "#DC3545", "#059669", "#1A2035", "#3A7C8A",
];

export function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(/[ -]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

export function dealTypeLabel(key: DealTypeKey): string {
  return DEAL_TYPES.find((d) => d.key === key)?.label ?? key;
}

export function dealTypeClass(key: DealTypeKey): string {
  return DEAL_TYPES.find((d) => d.key === key)?.cls ?? "";
}

export function fmt(n: number): string {
  return n.toLocaleString();
}

export function fmtRWF(n: number): string {
  if (n >= 1_000_000) return "RWF " + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return "RWF " + (n / 1_000).toFixed(0) + "K";
  return "RWF " + n.toLocaleString();
}
