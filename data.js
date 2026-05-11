'use strict';

/* ============================================================
   LEADERSHIP VALUES (48 standard + 2 custom slots)
   Removed: Psychological Safety, Energy, Stewardship
   Added: Sustainability
   ============================================================ */
const leadershipValues = [
  { title: "Clarity", description: "Makes expectations, decisions, and direction easy to understand." },
  { title: "Courage", description: "Addresses difficult issues early and acts when the right choice is uncomfortable." },
  { title: "Compassion", description: "Responds to people with warmth, perspective, and practical support." },
  { title: "Accountability", description: "Takes ownership of decisions, follow-through, and impact." },
  { title: "Integrity", description: "Acts consistently with stated principles, especially when pressure increases." },
  { title: "Trust", description: "Creates confidence through reliability, honesty, and fair judgement." },
  { title: "Collaboration", description: "Builds shared progress by involving others early and well." },
  { title: "Innovation", description: "Tests new ideas and improves how work is done." },
  { title: "Inclusion", description: "Ensures different people are heard, respected, and able to contribute." },
  { title: "Excellence", description: "Holds high standards for quality, effort, and outcomes." },
  { title: "Learning", description: "Uses experience, feedback, and mistakes to improve." },
  { title: "Adaptability", description: "Adjusts thinking and behaviour when circumstances change." },
  { title: "Service", description: "Focuses leadership on usefulness, contribution, and the needs of others." },
  { title: "Ambition", description: "Sets meaningful goals and raises expectations for what is possible." },
  { title: "Wellbeing", description: "Protects energy, recovery, and sustainable performance." },
  { title: "Respect", description: "Treats people with dignity, even in disagreement." },
  { title: "Curiosity", description: "Asks better questions before settling on answers." },
  { title: "Fairness", description: "Applies standards and opportunities consistently." },
  { title: "Transparency", description: "Shares information clearly and explains reasoning behind decisions." },
  { title: "Responsibility", description: "Recognises the effect of leadership choices on people and systems." },
  { title: "Creativity", description: "Generates fresh possibilities and challenges habitual thinking." },
  { title: "Community", description: "Strengthens belonging, shared purpose, and connection." },
  { title: "Sustainability", description: "Builds decisions and practices that protect the future, not just the present." },
  { title: "Resilience", description: "Maintains direction and composure through challenge." },
  { title: "Purpose", description: "Connects everyday work to something meaningful." },
  { title: "Humility", description: "Stays open to feedback, correction, and other perspectives." },
  { title: "Decisiveness", description: "Makes timely decisions with available information." },
  { title: "Patience", description: "Allows space for people, ideas, and change to develop." },
  { title: "Discipline", description: "Maintains helpful routines, standards, and follow-through." },
  { title: "Empathy", description: "Understands how situations are experienced by others." },
  { title: "Challenge", description: "Raises standards and questions assumptions with care." },
  { title: "Stability", description: "Provides steadiness when the environment feels uncertain." },
  { title: "Growth", description: "Supports people and teams to develop capability over time." },
  { title: "Recognition", description: "Notices contribution and makes effort visible." },
  { title: "Independence", description: "Gives people appropriate autonomy and ownership." },
  { title: "Connection", description: "Builds strong working relationships through presence and consistency." },
  { title: "Wisdom", description: "Uses judgement, experience, and perspective before acting." },
  { title: "Hope", description: "Creates belief that progress is possible." },
  { title: "Agility", description: "Moves quickly and intelligently when action is needed." },
  { title: "Evidence", description: "Uses data, insight, and evaluation to guide decisions." },
  { title: "Belonging", description: "Helps people feel part of something shared and worthwhile." },
  { title: "Simplicity", description: "Reduces noise and makes action easier." },
  { title: "Influence", description: "Builds commitment through meaning, trust, and clear communication." },
  { title: "Reflection", description: "Creates time to think, learn, and adjust." },
  { title: "Consistency", description: "Makes behaviour predictable, dependable, and fair." },
  { title: "Boldness", description: "Acts with conviction when a meaningful opportunity appears." },
  { title: "Care", description: "Pays attention to the human impact of decisions." },
  { title: "Legacy", description: "Makes choices that improve the future beyond immediate demands." }
];

/* ============================================================
   ROUND THEMES (10)
   ============================================================ */
const roundThemes = [
  { id: "leadership", title: "Leadership (Practice)", icon: "◈", prompt: "Imagine 10 years from now. Leaders across the University feel connected, confident in complexity, and able to make clear decisions under pressure." },
  { id: "sustainability", title: "Sustainability", icon: "◉", prompt: "Imagine 10 years from now. Sustainability is built into everyday decisions across teaching, research, operations, and partnerships." },
  { id: "teaching", title: "Teaching and Learning", icon: "◎", prompt: "Imagine 10 years from now. Learning feels applied, inclusive, and future-focused across every stage." },
  { id: "student", title: "Student Experience", icon: "◍", prompt: "Imagine 10 years from now. Students feel known, supported, challenged, and proud to belong." },
  { id: "partnerships", title: "Partnerships", icon: "◌", prompt: "Imagine 10 years from now. Partnerships create clear value and visible impact." },
  { id: "research", title: "Research Impact", icon: "◆", prompt: "Imagine 10 years from now. Research leads to meaningful change beyond academia." },
  { id: "culture", title: "Culture and Wellbeing", icon: "◇", prompt: "Imagine 10 years from now. Ambition is matched by care, clarity, and recovery." },
  { id: "innovation", title: "Innovation", icon: "◈", prompt: "Imagine 10 years from now. Ideas move quickly into practice." },
  { id: "community", title: "Community Engagement", icon: "◉", prompt: "Imagine 10 years from now. The University is deeply connected to its region." },
  { id: "future", title: "Future University", icon: "◎", prompt: "Imagine 10 years from now. The University adapts without losing its values." }
];

/* ============================================================
   CATALYST CARDS (10)
   ============================================================ */
const catalystCards = [
  { title: "Research Windfall", text: "An unexpected grant opens up for exactly this type of work. You have 60 days to submit. The timing could not be better." },
  { title: "National Spotlight", text: "A government report names this approach as emerging best practice. Suddenly, senior leaders across the sector want to visit and learn." },
  { title: "Student Takeover", text: "Final year students adopt the idea as a live capstone project. Their energy, networks, and fresh thinking accelerate progress by years." },
  { title: "Governor Backing", text: "A board governor with deep industry experience publicly champions the idea. Doors open. Conversations that were hard become easy." },
  { title: "Cross-Faculty Coalition", text: "Two faculties that rarely speak discover they are solving the same problem. A natural alliance forms and shared resource follows." },
  { title: "Alumni Offer", text: "A cluster of successful alumni offer pro bono expertise, mentoring, and introductions. They ask for nothing except to see the idea succeed." },
  { title: "Policy Tailwind", text: "Government priorities shift in exactly the direction you have been building towards. What felt niche is now strategically essential." },
  { title: "Tech Unlock", text: "A new platform removes the biggest logistical barrier to the idea. Something that would have taken a year to build now takes a fortnight." },
  { title: "Media Moment", text: "A journalist at a respected national outlet covers your work with genuine curiosity. Applications, enquiries, and internal support all rise." },
  { title: "Wellbeing Surge", text: "Engagement scores rise sharply in the team closest to this idea. People are talking about it in corridors. More staff want in." }
];

/* ============================================================
   CHALLENGER CARDS (10)
   ============================================================ */
const challengerCards = [
  { title: "Virus on Campus", text: "A new illness sweeps through campus mid-semester. Research pauses, staff are redeployed, and your project is deprioritised overnight. Adapt or stall." },
  { title: "Cyber Attack", text: "University systems are compromised. IT resource is diverted for months. Data-dependent parts of the plan cannot move and trust in digital infrastructure drops." },
  { title: "Industrial Action", text: "A prolonged pay dispute leads to a marking boycott and walkouts. Momentum fractures. The relationship between staff and senior leadership becomes strained." },
  { title: "Your Champion Leaves", text: "The most visible supporter of the idea is headhunted and resigns with six weeks notice. You must decide quickly: rebuild the coalition or recalibrate the vision." },
  { title: "Demographic Cliff", text: "Applicant numbers in the university's core subjects fall sharply. Every budget is reviewed. Your project must justify itself in a language it was not designed to speak." },
  { title: "Regulatory Inspection", text: "An unplanned OfS compliance review lands. Staff time is consumed by documentation and evidence gathering. Discretionary energy vanishes for months." },
  { title: "Rival Moves First", text: "A competitor university launches something strikingly similar and receives significant press coverage. You must differentiate, accelerate, or explain why your version is worth waiting for." },
  { title: "Sector Funding Shock", text: "A sudden change in government research funding triggers a university-wide spending freeze. All non-essential projects are paused pending a strategic review." },
  { title: "Leadership Restructure", text: "A new organisational structure is announced from the top. Reporting lines shift, your group loses its seat at the key table, and sponsorship becomes unclear." },
  { title: "Public Controversy", text: "A social media post misrepresents the idea and gains traction. The team must manage reputation, respond publicly, and keep internal confidence alive at the same time." }
];

/* ============================================================
   ARCHETYPES (9)
   ============================================================ */
const archetypes = [
  "Anchor", "Connector", "Navigator", "Guardian", "Explorer",
  "Energiser", "Synchroniser", "Decision-maker", "Innovator"
];

/* ============================================================
   GROW PROMPT CHIPS
   ============================================================ */
const growPromptChips = [
  "And then we could...",
  "This would help because...",
  "People would notice...",
  "A first sign would be...",
  "This connects to our Edge Values by...",
  "This supports Drive by...",
  "This reduces Threat by...",
  "This strengthens Soothing by..."
];

/* ============================================================
   TIME POINTS (with sort order)
   ============================================================ */
const timePoints = [
  { value: "now",      label: "Now",           order: 0 },
  { value: "30days",   label: "Next 30 days",  order: 1 },
  { value: "3months",  label: "3 months",      order: 2 },
  { value: "6months",  label: "6 months",      order: 3 },
  { value: "12months", label: "12 months",     order: 4 },
  { value: "2years",   label: "2 years",       order: 5 },
  { value: "5years",   label: "5 years",       order: 6 },
  { value: "2035",     label: "2035",          order: 7 }
];
