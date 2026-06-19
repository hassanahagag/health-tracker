// Hassan Health App — v10 (cloud connect: auto-clean URL + detailed error diagnostics)
import React, { useState, useEffect, useRef, useCallback } from "react";

// On Vercel/web there is no Claude window.storage — provide a harmless shim so the
// app relies purely on cloud (Supabase) + localStorage. (No-op fallback.)
if (typeof window !== "undefined" && !window.storage) {
  window.storage = { get: async () => null, set: async () => null };
}

// ============ TARGETS ============
const TARGETS = { calories: 1750, protein: 140, carbs: 175, fat: 55 };

// ============ MEAL PLAN ============
const MEAL_SLOTS = [
  {
    id: "breakfast", name: "Breakfast", time: "7:00–8:30 AM", budget: 400, icon: "🍳",
    planOptions: [
      { name: "3 egg whites + 1 egg + 2 toasts + veggies", calories: 340, protein: 24, carbs: 32, fat: 11 },
      { name: "3 turkey slices + low-fat cheese + ½ baladi + veggies", calories: 380, protein: 28, carbs: 38, fat: 10 },
      { name: "100g cottage cheese + 2 toasts + cucumber & pepper", calories: 310, protein: 22, carbs: 36, fat: 7 },
      { name: "Coffee + 1 cup skimmed milk", calories: 90, protein: 8, carbs: 12, fat: 1 },
    ],
  },
  {
    id: "snack1", name: "Mid-Morning Snack", time: "10:30–11:00 AM", budget: 200, icon: "🍎",
    planOptions: [
      { name: "1 apple + 15 raw almonds", calories: 195, protein: 5, carbs: 25, fat: 9 },
      { name: "2 digestive biscuits + skimmed milk", calories: 210, protein: 9, carbs: 30, fat: 6 },
      { name: "1 cup fresh juice (no sugar)", calories: 120, protein: 1, carbs: 28, fat: 0 },
      { name: "20 almonds or 15 cashews", calories: 160, protein: 6, carbs: 7, fat: 13 },
    ],
  },
  {
    id: "lunch", name: "Lunch", time: "1:30–2:30 PM", budget: 550, icon: "🍗",
    planOptions: [
      { name: "½ grilled chicken + large salad + olive oil", calories: 480, protein: 52, carbs: 12, fat: 24 },
      { name: "200g grilled salmon + salad", calories: 510, protein: 44, carbs: 10, fat: 30 },
      { name: "4 chicken breast slices + 5 tbsp rice + salad", calories: 540, protein: 48, carbs: 45, fat: 12 },
      { name: "1 can tuna + light mayo + corn + 6 tbsp pasta", calories: 520, protein: 38, carbs: 52, fat: 14 },
      { name: "3 pieces lean meat + 1 baked potato + veggies", calories: 530, protein: 42, carbs: 38, fat: 18 },
    ],
  },
  {
    id: "snack2", name: "Afternoon Snack", time: "5:00–5:30 PM", budget: 200, icon: "🥛",
    planOptions: [
      { name: "Greek yogurt 180g + 1 fruit", calories: 190, protein: 17, carbs: 24, fat: 3 },
      { name: "220ml low-fat rayeb + small banana", calories: 185, protein: 9, carbs: 32, fat: 3 },
      { name: "1 HiPro drink", calories: 160, protein: 25, carbs: 11, fat: 2 },
      { name: "Wonder-fit ice cream (1-2x/week)", calories: 180, protein: 10, carbs: 22, fat: 6 },
    ],
  },
  {
    id: "dinner", name: "Dinner", time: "8:00–9:00 PM", budget: 400, icon: "🥗",
    planOptions: [
      { name: "2 boiled eggs + steamed broccoli + olive oil", calories: 280, protein: 16, carbs: 10, fat: 19 },
      { name: "100g grilled white fish + sautéed spinach", calories: 250, protein: 26, carbs: 6, fat: 13 },
      { name: "150g cottage cheese + veggies + 1 toast", calories: 310, protein: 24, carbs: 28, fat: 9 },
      { name: "2 fruits + Greek yogurt 180g", calories: 290, protein: 18, carbs: 48, fat: 3 },
    ],
  },
];

// ============ MEDICINES ============
const DEFAULT_MEDS = [
  { id: "controloc", name: "Controloc", dose: "1 tablet", timing: "Morning — 30 min BEFORE breakfast", icon: "🌅", slot: "morning", note: "Empty stomach for best absorption" },
  { id: "multivit", name: "Multivitamin", dose: "1 tablet", timing: "With a fatty meal (lunch recommended)", icon: "💊", slot: "midday", note: "Fat helps absorb vitamins A, D, E, K" },
  { id: "vitd", name: "Vitamin D3 (NOW High Potency)", dose: "10,000 IU — 1 softgel", timing: "Every 3 DAYS with a fatty meal", icon: "☀️", slot: "midday", note: "NOT daily! Take with lunch on due days only", frequencyDays: 3 },
  { id: "lefsat", name: "Levcet (Levocetirizine)", dose: "1 tablet", timing: "At night", icon: "🌙", slot: "night", note: "Antihistamine — treats urticaria, may cause mild drowsiness" },
  { id: "lipitor", name: "Lipitor (Atorvastatin)", dose: "10 mg — 1 tablet", timing: "At night", icon: "🌙", slot: "night", note: "Statin for LDL — night dosing most effective. AVOID grapefruit" },
];

// ============ 20-MINUTE EXERCISE PROGRAM ============
// Redesigned: physio rehab + flexibility + pelvic floor / circulation work (supports sexual performance)
const EXERCISE_DAYS = {
  monday: {
    name: "Glutes & Pelvic Power", icon: "🍑", duration: "~20 min",
    exercises: [
      { id: "wgs", name: "World's Greatest Stretch", sets: "1 × 8/side", focus: "Full-body warm-up", illo: "stretch", anim: "sway",
        steps: ["Deep lunge, right foot forward", "Left hand on floor inside front foot", "Rotate right arm to ceiling, follow with eyes", "Hold 2 sec, switch sides"] },
      { id: "gb", name: "Glute Bridge", sets: "3 × 15", focus: "Glutes + pelvic blood flow", illo: "bridge", anim: "lift",
        steps: ["On back, knees bent, feet flat", "Drive hips up through heels", "Squeeze glutes HARD 2 sec at top", "Lower slowly — this is a key circulation exercise"] },
      { id: "kegel", name: "Pelvic Floor Hold (Kegel)", sets: "3 × 10 (5-sec holds)", focus: "Pelvic floor strength — erectile function", illo: "kegel", anim: "pulse",
        steps: ["Sit or lie comfortably", "Contract the muscles you'd use to stop urine flow mid-stream", "Hold 5 sec while breathing normally — don't clench abs or glutes", "Relax fully 5 sec between reps. Research shows this directly improves erectile function"] },
      { id: "slb", name: "Single-Leg Bridge", sets: "2 × 8/side", focus: "Glute strength + stability", illo: "bridge1", anim: "lift",
        steps: ["Bridge position, one leg extended", "Drive hips up through grounded heel", "Keep hips level", "Slow lower, switch legs"] },
      { id: "hamstretch", name: "Hamstring Stretch", sets: "2 × 30 sec/side", focus: "Physio: hamstring tightness", illo: "hamstretch", anim: "sway",
        steps: ["Lie on back, loop towel around one foot", "Straighten leg up until gentle stretch behind thigh", "Keep other leg flat, breathe deeply", "30 sec each side — no bouncing"] },
    ],
  },
  tuesday: {
    name: "Shoulder Rehab", icon: "💪", duration: "~20 min",
    exercises: [
      { id: "tspine", name: "Half-Kneeling T-Spine Rotation", sets: "2 × 8/side", focus: "Thoracic mobility", illo: "tspine", anim: "sway",
        steps: ["Half-kneel, hand behind head", "Rotate elbow to ceiling, eyes follow", "Slow return", "Rotation from upper back, not lower"] },
      { id: "tex", name: "T Exercise (prone)", sets: "2 × 10", focus: "Scapular control", illo: "tex", anim: "lift",
        steps: ["Face-down, arms out in a 'T', thumbs UP", "Squeeze blades, lift arms 10–15cm", "Hold 2 sec", "Lower slowly"] },
      { id: "extrot", name: "Banded External Rotation", sets: "3 × 12", focus: "Rotator cuff — pain-free range ONLY", illo: "extrot", anim: "sway",
        steps: ["Elbow pinned at side, bent 90°", "Rotate forearm out like opening a door", "ONLY pain-free range", "2-sec return — this heals your supraspinatus"] },
      { id: "retract", name: "Banded Shoulder Retraction", sets: "3 × 10", focus: "Posture", illo: "retract", anim: "sway",
        steps: ["Band in front at chest height", "Pull apart, squeeze blades together", "Imagine pinching a pencil between blades", "Hold 2 sec, slow release"] },
      { id: "pecstretch", name: "Doorway Pec Stretch", sets: "2 × 30 sec", focus: "Physio: pectoral tightness", illo: "pecstretch", anim: "sway",
        steps: ["Forearm on doorframe, elbow at shoulder height", "Step forward gently until chest stretch", "GENTLE — no shoulder pain allowed", "Breathe deeply, 30 sec each side"] },
    ],
  },
  wednesday: {
    name: "Cardio Walk + Kegels", icon: "🚶", duration: "20–30 min",
    exercises: [
      { id: "walk_w", name: "Brisk Walk", sets: "20–30 min", focus: "Heart, liver & circulation — aerobic fitness is the #1 proven factor for sexual performance", illo: "walk", anim: "walkcycle",
        steps: ["Pace where talking is possible but slightly breathy", "Tall posture, natural arm swing", "Best after a meal — blood sugar control", "Aerobic exercise improves erectile function as much as medication in studies"] },
      { id: "kegel_w", name: "Pelvic Floor Holds (during walk or after)", sets: "3 × 10", focus: "Pelvic floor endurance", illo: "kegel", anim: "pulse",
        steps: ["Can be done anywhere — even while walking", "Contract pelvic floor 5 sec", "Full relax 5 sec", "Nobody can tell you're doing them"] },
    ],
  },
  thursday: {
    name: "Core & Hips", icon: "🔄", duration: "~20 min",
    exercises: [
      { id: "hipcar", name: "Hip CAR", sets: "2 × 6/side", focus: "Hip mobility + pelvic circulation", illo: "hipcar", anim: "circle",
        steps: ["Stand tall, hold wall", "Lift knee to hip height", "Draw biggest slow circle with knee", "Controlled — no momentum"] },
      { id: "db", name: "Dead Bug", sets: "3 × 8/side", focus: "Deep core — supports pelvis & back", illo: "deadbug", anim: "sway",
        steps: ["Back pressed into floor, arms & knees up", "Lower opposite arm + leg slowly", "Back stays flat", "Alternate sides"] },
      { id: "plank", name: "Forearm Plank", sets: "3 × 30 sec", focus: "Core endurance", illo: "plank", anim: "pulse",
        steps: ["Elbows under shoulders", "Straight line, glutes squeezed", "Breathe steadily", "Knees down if form breaks"] },
      { id: "clam", name: "Clamshell (band)", sets: "2 × 12/side", focus: "Glute medius — knee protection", illo: "clam", anim: "sway",
        steps: ["On side, knees bent 45°, band above knees", "Feet together, lift top knee", "Don't roll hips back", "Slow 2-sec lower"] },
      { id: "hipflexor", name: "Kneeling Hip Flexor Stretch", sets: "2 × 30 sec/side", focus: "Opens hips — desk-sitting antidote, pelvic blood flow", illo: "hipflexor", anim: "sway",
        steps: ["Half-kneel, back knee on cushion", "Tuck pelvis under, shift weight gently forward", "Feel stretch in front of back hip", "Tight hip flexors restrict pelvic circulation"] },
    ],
  },
  friday: {
    name: "Flexibility Flow", icon: "🧘", duration: "~20 min",
    exercises: [
      { id: "wgs_f", name: "World's Greatest Stretch", sets: "2 × 8/side", focus: "Dynamic full-body", illo: "stretch", anim: "sway",
        steps: ["Deep lunge, hand inside foot", "Rotate arm to ceiling", "Hold 2 sec each rep", "Flow smoothly side to side"] },
      { id: "hamstretch_f", name: "Hamstring Stretch", sets: "2 × 30 sec/side", focus: "Physio priority", illo: "hamstretch", anim: "sway",
        steps: ["Towel around foot, leg up", "Gentle stretch, no bouncing", "Breathe into it", "Both sides"] },
      { id: "calfstretch", name: "Wall Calf Stretch", sets: "2 × 30 sec/side", focus: "Physio: calf tightness", illo: "calfstretch", anim: "sway",
        steps: ["Hands on wall, one leg stepped back", "Back heel pressed into floor, knee straight", "Lean forward until calf stretch", "30 sec, switch"] },
      { id: "childpose", name: "Child's Pose + Deep Breathing", sets: "2 min", focus: "Stress relief — cortisol worsens urticaria AND sexual performance", illo: "childpose", anim: "breathe",
        steps: ["Kneel, sit back on heels, arms forward on floor", "Forehead toward floor, relax completely", "Slow breaths: 4 sec in, 6 sec out", "Stress reduction measurably improves testosterone & skin"] },
      { id: "kegel_f", name: "Pelvic Floor Holds", sets: "3 × 10", focus: "Consistency is what makes kegels work", illo: "kegel", anim: "pulse",
        steps: ["Contract 5 sec, relax 5 sec", "Breathe normally throughout", "Don't recruit abs/glutes", "Daily consistency = results in 4–6 weeks"] },
    ],
  },
  saturday: {
    name: "Legs & Cardio", icon: "🏃", duration: "~20 min",
    exercises: [
      { id: "bsquat", name: "Banded Squat (shallow)", sets: "3 × 10", focus: "Leg strength — pain-free depth only", illo: "squat", anim: "lift",
        steps: ["Band above knees, feet shoulder-width", "Hips back like sitting on a chair", "Only as deep as ZERO knee pain", "Knees push out against band"] },
      { id: "stepup", name: "Step-Up (low ~20cm)", sets: "2 × 8/side", focus: "Single-leg strength", illo: "stepup", anim: "lift",
        steps: ["Low stable step", "Drive up through HEEL", "2-sec controlled descent", "All reps, then switch"] },
      { id: "gb_s", name: "Glute Bridge", sets: "3 × 12", focus: "Glutes + circulation", illo: "bridge", anim: "lift",
        steps: ["Hips up, squeeze 2 sec", "Straight line at top", "Slow lower", "Quality over speed"] },
      { id: "walk_s", name: "Brisk Walk", sets: "10–15 min", focus: "Finish with cardio", illo: "walk", anim: "walkcycle",
        steps: ["Right after the strength work", "Moderate brisk pace", "Outdoors = vitamin D bonus", "Completes your ~20 min"] },
    ],
  },
  sunday: { name: "Full Rest", icon: "😴", duration: "", exercises: [] },
};

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Curated YouTube demo searches per exercise (opens a video showing correct form)
const EX_VIDEOS = {
  wgs: "https://www.youtube.com/results?search_query=worlds+greatest+stretch+how+to",
  gb: "https://www.youtube.com/results?search_query=glute+bridge+exercise+proper+form",
  slb: "https://www.youtube.com/results?search_query=single+leg+glute+bridge+how+to",
  kegel: "https://www.youtube.com/results?search_query=kegel+exercises+for+men+how+to",
  hamstretch: "https://www.youtube.com/results?search_query=supine+hamstring+stretch+with+strap",
  tspine: "https://www.youtube.com/results?search_query=half+kneeling+thoracic+rotation",
  tex: "https://www.youtube.com/results?search_query=prone+T+raise+scapular+exercise",
  wy: "https://www.youtube.com/results?search_query=prone+W+to+Y+shoulder+exercise",
  extrot: "https://www.youtube.com/results?search_query=banded+external+rotation+rotator+cuff",
  retract: "https://www.youtube.com/results?search_query=band+pull+apart+scapular+retraction",
  serratus: "https://www.youtube.com/results?search_query=supine+serratus+punch+protraction",
  pecstretch: "https://www.youtube.com/results?search_query=doorway+pec+stretch+how+to",
  hipcar: "https://www.youtube.com/results?search_query=hip+CARs+controlled+articular+rotations",
  db: "https://www.youtube.com/results?search_query=dead+bug+exercise+proper+form",
  plank: "https://www.youtube.com/results?search_query=forearm+plank+proper+form",
  clam: "https://www.youtube.com/results?search_query=clamshell+exercise+with+band",
  hipflexor: "https://www.youtube.com/results?search_query=kneeling+hip+flexor+stretch",
  calfstretch: "https://www.youtube.com/results?search_query=wall+calf+stretch+how+to",
  childpose: "https://www.youtube.com/results?search_query=childs+pose+with+deep+breathing",
  squat: "https://www.youtube.com/results?search_query=banded+squat+proper+form+beginner",
  stepup: "https://www.youtube.com/results?search_query=step+up+exercise+proper+form",
  walk: "https://www.youtube.com/results?search_query=brisk+walking+for+weight+loss+technique",
};
const videoFor = (ex) => EX_VIDEOS[ex.id] || EX_VIDEOS[ex.illo] || EX_VIDEOS[ex.id.replace(/_[a-z]$/, "")] || null;

const AVOID_FOODS = ["fried", "deep-fried", "sugary", "soda", "cola", "alcohol", "processed meat", "sausage", "hot dog", "trans fat", "margarine", "shellfish", "shrimp", "peanut"];

// ============ ANIMATED SVG ILLUSTRATIONS ============
const ANIMS = `
@keyframes illoSway { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes illoLift { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
@keyframes illoPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.75; } }
@keyframes illoCircle { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes illoWalk { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
@keyframes illoBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes logFlash { 0% { background: #A8D5BA; } 100% {} }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
`;

const animStyle = (anim, origin) => ({
  transformOrigin: origin,
  transformBox: "view-box",
  animation: {
    sway: "illoSway 1.8s ease-in-out infinite",
    lift: "illoLift 1.6s ease-in-out infinite",
    pulse: "illoPulse 1.4s ease-in-out infinite",
    circle: "illoCircle 3s linear infinite",
    walkcycle: "illoWalk 1s ease-in-out infinite",
    breathe: "illoBreathe 2.5s ease-in-out infinite",
  }[anim] || "none",
});

const Illo = ({ type, anim = "sway", size = 80, animate = true }) => {
  const s = { stroke: "#1E3A2F", strokeWidth: 3, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const a = { stroke: "#C45C2E", strokeWidth: 3, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const head = (cx, cy) => <circle cx={cx} cy={cy} r="6" {...s} fill="#A8D5BA" />;
  const floor = <line x1="5" y1="92" x2="95" y2="92" stroke="#C9C4B8" strokeWidth="2" strokeDasharray="4 3" />;
  const A = ({ origin, children }) => <g style={animate ? animStyle(anim, origin) : {}}>{children}</g>;

  const illos = {
    bridge: (<g>{floor}{head(20, 78)}<A origin="45px 70px"><path d="M26 76 L45 58 L68 58 L82 88" {...s} /><line x1="68" y1="58" x2="68" y2="88" {...s} /></A></g>),
    bridge1: (<g>{floor}{head(20, 78)}<A origin="45px 70px"><path d="M26 76 L45 58 L66 58 L80 88" {...s} /><path d="M66 58 L88 42" {...a} /></A></g>),
    clam: (<g>{floor}{head(18, 70)}<path d="M24 72 L52 76 L72 70 L88 80" {...s} /><A origin="72px 70px"><path d="M72 70 L84 54" {...a} /></A></g>),
    slr: (<g>{floor}{head(18, 84)}<path d="M24 84 L50 84" {...s} /><path d="M50 84 L62 88 L78 88" {...s} /><A origin="50px 84px"><path d="M50 84 L80 56" {...a} /></A></g>),
    deadbug: (<g>{floor}{head(30, 82)}<path d="M36 82 L66 82" {...s} /><A origin="48px 82px"><path d="M48 82 L42 56" {...a} /></A><A origin="66px 82px"><path d="M66 82 L74 60 L82 64" {...a} /></A></g>),
    plank: (<g>{floor}<A origin="50px 75px">{head(20, 62)}<path d="M26 64 L62 70 L84 88" {...s} /><path d="M30 66 L30 88" {...s} /><line x1="24" y1="88" x2="38" y2="88" {...s} /></A></g>),
    stretch: (<g>{floor}{head(38, 30)}<path d="M40 36 L48 56 L34 88" {...s} /><path d="M48 56 L72 88" {...s} /><path d="M40 36 L20 60" {...s} /><A origin="40px 36px"><path d="M40 36 L58 18" {...a} /></A></g>),
    tspine: (<g>{floor}{head(46, 28)}<path d="M48 34 L50 60 L36 88" {...s} /><path d="M50 60 L66 88" {...s} /><A origin="48px 36px"><path d="M48 36 L70 24" {...a} /></A></g>),
    tex: (<g>{floor}{head(16, 76)}<path d="M22 78 L70 80 L88 88" {...s} /><A origin="44px 79px"><path d="M42 79 L42 58" {...a} /><path d="M46 79 L46 100" stroke="#C45C2E" strokeWidth="3" opacity="0.4" /></A></g>),
    extrot: (<g>{floor}{head(40, 22)}<path d="M42 28 L44 58 L36 88" {...s} /><path d="M44 58 L54 88" {...s} /><path d="M43 38 L58 40" {...s} /><A origin="58px 40px"><path d="M58 40 L72 28" {...a} /></A><path d="M66 26 L86 22" stroke="#D4A843" strokeWidth="2.5" strokeDasharray="4 2" /></g>),
    retract: (<g>{floor}{head(48, 22)}<path d="M50 28 L52 58 L44 88" {...s} /><path d="M52 58 L62 88" {...s} /><A origin="51px 36px"><path d="M51 36 L30 40" {...a} /><path d="M51 36 L72 40" {...a} /></A><path d="M14 40 L30 40 M72 40 L88 40" stroke="#D4A843" strokeWidth="2.5" strokeDasharray="4 2" /></g>),
    squat: (<g>{floor}{head(46, 30)}<A origin="46px 60px"><path d="M48 36 L52 56 L44 70 L46 88" {...s} /><line x1="36" y1="62" x2="58" y2="62" stroke="#D4A843" strokeWidth="3" /><path d="M49 42 L66 44" {...a} /></A></g>),
    stepup: (<g>{floor}<rect x="60" y="74" width="32" height="18" stroke="#C9C4B8" strokeWidth="2.5" fill="#EFEBE2" />{head(40, 24)}<path d="M42 30 L46 56 L40 88" {...s} /><A origin="46px 56px"><path d="M46 56 L66 74" {...a} /></A></g>),
    walk: (<g>{floor}{head(48, 20)}<path d="M50 26 L52 52" {...s} /><A origin="52px 52px"><path d="M52 52 L40 88" {...s} /><path d="M52 52 L68 86" {...a} /></A><A origin="51px 34px"><path d="M51 34 L38 50" {...s} /><path d="M51 34 L66 44" {...a} /></A></g>),
    hipcar: (<g>{floor}{head(34, 22)}<path d="M36 28 L38 58 L30 88" {...s} /><A origin="38px 58px"><path d="M38 58 L60 64" {...a} /></A></g>),
    kegel: (<g>{floor}{head(50, 26)}<path d="M52 32 L52 60 L40 88" {...s} /><path d="M52 60 L64 88" {...s} /><A origin="52px 66px"><circle cx="52" cy="66" r="9" stroke="#C45C2E" strokeWidth="2.5" fill="rgba(196,92,46,0.15)" /><circle cx="52" cy="66" r="4" fill="#C45C2E" /></A></g>),
    hamstretch: (<g>{floor}{head(18, 84)}<path d="M24 84 L48 84" {...s} /><path d="M48 84 L60 88 L74 88" {...s} /><A origin="48px 84px"><path d="M48 84 L70 50" {...a} /><path d="M58 64 L72 58" stroke="#D4A843" strokeWidth="2" strokeDasharray="3 2" /></A></g>),
    calfstretch: (<g>{floor}<line x1="14" y1="8" x2="14" y2="92" stroke="#C9C4B8" strokeWidth="3" />{head(40, 24)}<path d="M42 30 L38 56" {...s} /><path d="M38 30 L16 34 M38 42 L16 44" {...s} /><path d="M38 56 L34 88" {...s} /><A origin="38px 56px"><path d="M38 56 L66 88" {...a} /></A></g>),
    pecstretch: (<g>{floor}<line x1="78" y1="8" x2="78" y2="92" stroke="#C9C4B8" strokeWidth="3" />{head(44, 26)}<path d="M46 32 L48 60 L40 88" {...s} /><path d="M48 60 L58 88" {...s} /><A origin="46px 36px"><path d="M46 36 L76 30" {...a} /></A></g>),
    hipflexor: (<g>{floor}{head(40, 30)}<path d="M42 36 L46 60" {...s} /><path d="M46 60 L66 64 L66 88" {...s} /><A origin="46px 60px"><path d="M46 60 L30 88" {...a} /></A></g>),
    childpose: (<g>{floor}<A origin="50px 80px">{head(22, 72)}<path d="M28 74 L44 64 L66 76 L70 88" {...s} /><path d="M28 76 L10 84" {...s} /><path d="M44 64 L66 76" {...s} /></A></g>),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" rx="12" fill="#F8F5EE" />
      {illos[type] || illos.walk}
    </svg>
  );
};

// ============ DATE HELPERS (2 AM rollover, LOCAL timezone) ============
const toLocalKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const effectiveTodayKey = () => {
  const d = new Date(Date.now() - 2 * 3600 * 1000); // day flips at 2 AM local, not midnight
  return toLocalKey(d);
};
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toLocalKey(d);
};
const weekdayOf = (dateStr) => DAY_KEYS[new Date(dateStr + "T12:00:00").getDay()];
const prettyDate = (dateStr) => new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const fileToBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("Read failed")); r.readAsDataURL(file); });

// Safe local mirror: tries localStorage (works in the real Safari home-screen app,
// silently no-ops in sandboxes where it's blocked). An independent 2nd copy on the phone.
const lsSet = (k, v) => { try { if (window.localStorage) { window.localStorage.setItem(k, v); return true; } } catch (e) {} return false; };
const lsGet = (k) => { try { if (window.localStorage) return window.localStorage.getItem(k); } catch (e) {} return null; };

// ============ CLOUD STORAGE (Supabase) ============
// One-time setup writes these into localStorage so they persist. Until configured,
// the app runs on local cache only. See the in-app Cloud Setup card (Progress tab).
const CLOUD = {
  get url() { return lsGet("hassan-cfg-url") || ""; },
  get key() { return lsGet("hassan-cfg-key") || ""; },
  get user() { return lsGet("hassan-cfg-user") || ""; },
  get ready() { return !!(this.url && this.key && this.user); },
};

// Reads one key from the cloud kv table. Returns string value or null.
async function cloudGet(storageKey) {
  if (!CLOUD.ready) return null;
  try {
    const res = await fetch(`${CLOUD.url}/rest/v1/kv?select=v&user_code=eq.${encodeURIComponent(CLOUD.user)}&k=eq.${encodeURIComponent(storageKey)}`, {
      headers: { apikey: CLOUD.key, Authorization: `Bearer ${CLOUD.key}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows && rows[0] ? rows[0].v : null;
  } catch (e) { return null; }
}

// Upserts one key to the cloud kv table. Returns true on success.
async function cloudSet(storageKey, value) {
  if (!CLOUD.ready) return false;
  try {
    const res = await fetch(`${CLOUD.url}/rest/v1/kv?on_conflict=user_code,k`, {
      method: "POST",
      headers: {
        apikey: CLOUD.key, Authorization: `Bearer ${CLOUD.key}`,
        "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ user_code: CLOUD.user, k: storageKey, v: value, updated_at: new Date().toISOString() }),
    });
    return res.ok;
  } catch (e) { return false; }
}

// Unified storage: cloud (source of truth) + localStorage cache + window.storage.
// WRITE goes to all three. READ prefers cloud, falls back to local cache.
const store = {
  async get(key) {
    if (CLOUD.ready) {
      const v = await cloudGet(key);
      if (v !== null) { lsSet(key, v); return v; }
    }
    const local = lsGet(key);
    if (local !== null) return local;
    try { const r = await window.storage.get(key); return r?.value ?? null; } catch (e) { return null; }
  },
  async set(key, value) {
    lsSet(key, value);                              // instant local cache
    let cloudOk = false;
    if (CLOUD.ready) cloudOk = await cloudSet(key, value); // durable cloud
    try { await window.storage.set(key, value); } catch (e) {}
    return cloudOk || CLOUD.ready === false;        // ok if cloud saved, or if no cloud configured (local-only mode)
  },
};

// ============ AI ============
const FOOD_PROMPT_SUFFIX = `Context: the user is on a 1750 kcal/day plan with fatty liver disease, borderline high LDL, and chronic urticaria — set "flagged": true for fried foods, processed meats (pastrami, sausage), sugary items, shellfish, peanuts, or artificial additives. Egyptian foods are common (foul, taameya, koshari, baladi bread, molokhia etc) — use accurate Egyptian portion estimates. If portion not given, assume one standard serving.

CRITICAL OUTPUT RULE: Your ENTIRE response must be ONLY a single valid JSON object. No markdown, no code fences, no explanation. Start with { and end with }.

Required JSON shape:
{"items":[{"name":"food","portion":"portion"}],"totalName":"short meal name","calories":350,"protein":15,"carbs":40,"fat":12,"flagged":false,"flagReason":null,"healthNote":"one short sentence specific to this user's conditions"}

All numbers must be plain numbers (no units, no strings).`;

const LABEL_PROMPT = `This is a photo of a NUTRITION FACTS LABEL on a food package. Read the label carefully and extract the per-serving nutrition values.

CRITICAL OUTPUT RULE: Your ENTIRE response must be ONLY a single valid JSON object. No markdown, no code fences, no explanation. Start with { and end with }.

Required JSON shape:
{"productName":"name of product if visible, else 'Packaged food'","servingSize":"the serving size as written on label e.g. '30g' or '1 cup (240ml)'","calories":150,"protein":5,"carbs":20,"fat":6,"flagged":false,"flagReason":null,"healthNote":"one short note for a user with fatty liver, high LDL and urticaria"}

Numbers are PER SERVING as written on the label. Set flagged:true if ingredients/type suggest fried food, processed meat, high added sugar, trans fat, or artificial additives. All numbers plain numbers.`;

const FALLBACK_DB = [
  { k: ["foul", "fool", "fava"], name: "Foul sandwich", cal: 320, p: 13, c: 48, f: 9 },
  { k: ["taameya", "falafel"], name: "Taameya sandwich", cal: 380, p: 11, c: 45, f: 17, flag: true, reason: "Fried — avoid for fatty liver" },
  { k: ["koshari", "koshary"], name: "Koshari plate", cal: 550, p: 16, c: 95, f: 12 },
  { k: ["egg"], name: "Eggs", cal: 150, p: 12, c: 1, f: 10 },
  { k: ["chicken"], name: "Grilled chicken", cal: 280, p: 40, c: 0, f: 12 },
  { k: ["tuna"], name: "Tuna", cal: 180, p: 30, c: 0, f: 6 },
  { k: ["salmon"], name: "Salmon", cal: 400, p: 40, c: 0, f: 26 },
  { k: ["rice"], name: "Rice portion", cal: 200, p: 4, c: 44, f: 1 },
  { k: ["pasta"], name: "Pasta portion", cal: 220, p: 8, c: 43, f: 2 },
  { k: ["yogurt", "rayeb", "zabadi"], name: "Yogurt", cal: 120, p: 10, c: 12, f: 4 },
  { k: ["salad", "vegetable", "veggie"], name: "Salad/veggies", cal: 80, p: 2, c: 10, f: 4 },
  { k: ["sandwich"], name: "Sandwich", cal: 350, p: 14, c: 42, f: 13 },
  { k: ["pastrami", "sausage", "hot dog"], name: "Processed meat", cal: 180, p: 12, c: 3, f: 14, flag: true, reason: "Processed meat — avoid for cholesterol & urticaria" },
  { k: ["fruit", "apple", "banana", "orange"], name: "Fruit", cal: 90, p: 1, c: 22, f: 0 },
];

const fallbackEstimate = (text) => {
  const t = text.toLowerCase();
  let hits = FALLBACK_DB.filter((f) => f.k.some((kw) => t.includes(kw)));
  const hasSpecificDish = hits.some((h) => ["foul", "taameya", "koshari"].includes(h.k[0]));
  if (hasSpecificDish) hits = hits.filter((h) => h.k[0] !== "sandwich");
  if (!hits.length) return null;
  const total = hits.reduce((a, h) => ({ cal: a.cal + h.cal, p: a.p + h.p, c: a.c + h.c, f: a.f + h.f }), { cal: 0, p: 0, c: 0, f: 0 });
  const flagged = hits.find((h) => h.flag);
  return {
    items: hits.map((h) => ({ name: h.name, portion: "1 serving (approx)" })),
    totalName: text.length > 40 ? text.slice(0, 40) + "…" : text,
    calories: total.cal, protein: total.p, carbs: total.c, fat: total.f,
    flagged: !!flagged, flagReason: flagged?.reason || null,
    healthNote: "⚠️ Approximate offline estimate — AI was unreachable.",
  };
};

// Last-resort estimate when food isn't in the mini-DB: use typical calories for that meal slot
const genericEstimate = (text, slotId) => {
  const typical = { breakfast: { cal: 350, p: 18, c: 35, f: 13 }, snack1: { cal: 180, p: 6, c: 22, f: 7 }, lunch: { cal: 500, p: 35, c: 40, f: 20 }, snack2: { cal: 180, p: 14, c: 20, f: 4 }, dinner: { cal: 350, p: 25, c: 20, f: 15 } };
  const v = typical[slotId] || typical.lunch;
  const t = text.toLowerCase();
  const flagged = AVOID_FOODS.find((a) => t.includes(a));
  return {
    items: [{ name: text, portion: "estimated portion" }],
    totalName: text.length > 40 ? text.slice(0, 40) + "…" : text,
    calories: v.cal, protein: v.p, carbs: v.c, fat: v.f,
    flagged: !!flagged, flagReason: flagged ? `Contains "${flagged}" — on your avoid list` : null,
    healthNote: "⚠️ Rough estimate (AI unavailable) — tap calories to adjust.",
  };
};

const extractJson = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON in response");
  return JSON.parse(text.slice(start, end + 1));
};

// Attempts the direct API only. Does NOT use the in-app completion bridge, which
// surfaces an uncatchable full-screen error in the published sandbox. Any failure →
// throw "network-unavailable", and callers fall back to local estimation safely.
const callClaude = async (content) => {
  if (Array.isArray(content)) throw new Error("network-unavailable");
  let response;
  try {
    response = await fetch("/api/analyze-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodDescription: content,
        userProfile: "37yo male, 90kg, target 80kg, 1750 kcal/day, 140g protein, fatty liver disease, high LDL, urticaria. Eats Egyptian foods (foul, taameya, koshari, baladi bread) and international meals.",
      }),
    });
  } catch (netErr) { throw new Error("network-unavailable"); }
  if (!response.ok) throw new Error(`API status ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error || "API error");
  const name = data.description || (content.length > 40 ? content.slice(0, 40) + "…" : content);
  return {
    items: [{ name, portion: "1 serving" }],
    totalName: name,
    calories: Math.round(data.calories || 0),
    protein: Math.round(data.protein || 0),
    carbs: Math.round(data.carbs || 0),
    fat: Math.round(data.fat || 0),
    flagged: false, flagReason: null, healthNote: null,
  };
};

// ============ MAIN APP ============
export default function App() {
  const TODAY = effectiveTodayKey();
  const [tab, setTab] = useState("dashboard");
  const [viewDate, setViewDate] = useState(TODAY);          // for food & meds
  const [exDate, setExDate] = useState(TODAY);              // for exercise (can be future)
  const [foodLog, setFoodLog] = useState([]);
  const [exerciseLog, setExerciseLog] = useState({});
  const [medLog, setMedLog] = useState({});
  const [meds, setMeds] = useState(DEFAULT_MEDS);
  const [medLastTaken, setMedLastTaken] = useState({});
  const [weight, setWeight] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [calTarget, setCalTarget] = useState(TARGETS.calories);
  const [targetUpdatedOn, setTargetUpdatedOn] = useState(null);
  const [summary, setSummary] = useState({});               // {date: {cal,protein,exDone,exTotal,medsDone,medsTotal,steps}}
  const [exRecord, setExRecord] = useState({});             // exercise log of exDate (separate from viewDate record)
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [labelResult, setLabelResult] = useState(null);
  const [labelQty, setLabelQty] = useState(1);
  const [photoMode, setPhotoMode] = useState("meal");       // 'meal' | 'label'
  const [selectedSlot, setSelectedSlot] = useState("lunch");
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const loadedDateRef = useRef(null);   // which date's data is currently in foodLog/medLog
  const loadingRef = useRef(false);     // true while loadDay is writing state
  const [imgPreview, setImgPreview] = useState(null);
  const [inlineText, setInlineText] = useState({});
  const [inlineAnalyzing, setInlineAnalyzing] = useState(null);
  const [editingCal, setEditingCal] = useState(null);
  const [justLogged, setJustLogged] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [editingMed, setEditingMed] = useState(null);
  const [medNameInput, setMedNameInput] = useState("");
  const [backupText, setBackupText] = useState("");
  const [backupMsg, setBackupMsg] = useState(null);
  const [storageOk, setStorageOk] = useState(null); // null = checking, true/false = result
  const [cloudCfg, setCloudCfg] = useState({ url: lsGet("hassan-cfg-url") || "", key: lsGet("hassan-cfg-key") || "", user: lsGet("hassan-cfg-user") || "" });
  const [cloudStatus, setCloudStatus] = useState(CLOUD.ready ? "configured" : "not-configured");
  const [cloudMsg, setCloudMsg] = useState(null);
  const fileRef = useRef(null);

  // ---- Storage health probe ----
  useEffect(() => {
    (async () => {
      try {
        const okLs = lsSet("hassan-probe", "ok") && lsGet("hassan-probe") === "ok";
        setStorageOk(okLs || CLOUD.ready);
      } catch (e) { setStorageOk(false); }
    })();
  }, []);

  // ---- Backup & Restore ----
  // ---- Cloud config: save credentials, test connection, pull existing data ----
  const saveCloudConfig = async () => {
    setCloudMsg(null);
    // Auto-clean URL: strip spaces, trailing slash, and any /rest/v1 path the user pasted
    let url = cloudCfg.url.trim().replace(/\s+/g, "");
    url = url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    const key = cloudCfg.key.trim().replace(/\s+/g, "");
    const user = cloudCfg.user.trim().toLowerCase().replace(/\s+/g, "");
    if (!url || !key || !user) { setCloudMsg("✗ Fill in all three fields."); return; }
    if (!url.startsWith("https://")) { setCloudMsg("✗ Project URL should start with https://"); return; }
    if (!/\.supabase\.co$/i.test(url)) { setCloudMsg(`✗ URL should end in .supabase.co — got "${url}". Remove anything after .supabase.co`); return; }
    setCloudStatus("testing");

    // Direct test using cleaned values (don't rely on getters/localStorage timing)
    try {
      const testKey = "hassan-cloud-test";
      const writeRes = await fetch(`${url}/rest/v1/kv?on_conflict=user_code,k`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ user_code: user, k: testKey, v: JSON.stringify({ t: Date.now() }), updated_at: new Date().toISOString() }),
      });
      if (!writeRes.ok) {
        let detail = "";
        try { const j = await writeRes.json(); detail = j.message || j.hint || j.code || JSON.stringify(j); } catch (e2) { detail = `HTTP ${writeRes.status}`; }
        setCloudStatus("error");
        if (writeRes.status === 404) setCloudMsg(`✗ Table not found (404) — re-run the setup SQL. Detail: ${detail}`);
        else if (writeRes.status === 401 || writeRes.status === 403) setCloudMsg(`✗ Auth/policy error (${writeRes.status}) — re-run the 'create policy' SQL. Detail: ${detail}`);
        else setCloudMsg(`✗ Connect failed (HTTP ${writeRes.status}): ${detail}`);
        return;
      }
      const readRes = await fetch(`${url}/rest/v1/kv?select=v&user_code=eq.${encodeURIComponent(user)}&k=eq.${encodeURIComponent(testKey)}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!readRes.ok) { setCloudStatus("error"); setCloudMsg(`✗ Wrote OK but read failed (HTTP ${readRes.status}). Check the read policy.`); return; }

      // Success — persist config now that we know it works
      lsSet("hassan-cfg-url", url); lsSet("hassan-cfg-key", key); lsSet("hassan-cfg-user", user);
      setCloudCfg({ url, key, user });
      setCloudStatus("configured");
      setCloudMsg("✓ Cloud connected! Pulling any existing data…");
      await pullFromCloud();
      setCloudMsg("✓ Cloud connected & synced! Your data is now permanent across all devices.");
    } catch (e) {
      setCloudStatus("error");
      setCloudMsg(`✗ Couldn't reach Supabase: ${e.message}. Check the URL is exactly https://...supabase.co and you have internet.`);
    }
  };

  const pullFromCloud = async () => {
    // Reload today + key records from cloud (store.get prefers cloud)
    await loadDay(TODAY);
    const loadKey = async (key, apply) => { try { const v = await store.get(key); if (v) apply(JSON.parse(v)); } catch (e) {} };
    await loadKey("hassan-weight-history", setWeightHistory);
    await loadKey("hassan-daily-summary", setSummary);
    await loadKey("hassan-med-last-taken", setMedLastTaken);
    await loadKey("hassan-cal-target", (o) => { setCalTarget(o.target || TARGETS.calories); setTargetUpdatedOn(o.updatedOn || null); });
    await loadKey("hassan-meds-list", (v) => { if (Array.isArray(v) && v.length) setMeds(v); });
  };

  const disconnectCloud = () => {
    lsSet("hassan-cfg-url", ""); lsSet("hassan-cfg-key", ""); lsSet("hassan-cfg-user", "");
    setCloudCfg({ url: "", key: "", user: "" }); setCloudStatus("not-configured"); setCloudMsg("Cloud disconnected. Data saves locally only.");
  };

  const exportBackup = async () => {
    setBackupMsg(null);
    try {
      const data = {};
      // 1) GUARANTEED: capture current in-memory state (whatever you see on screen right now)
      data["hassan-weight-history"] = JSON.stringify(weightHistory);
      data["hassan-daily-summary"] = JSON.stringify(summary);
      data["hassan-med-last-taken"] = JSON.stringify(medLastTaken);
      data["hassan-meds-list"] = JSON.stringify(meds);
      data["hassan-cal-target"] = JSON.stringify({ target: calTarget, updatedOn: targetUpdatedOn });
      data[`hassan-day-${viewDate}`] = JSON.stringify({ foodLog, exerciseLog: viewDate === exDate ? exRecord : exerciseLog, medLog, weight });
      // 2) Plus: read every stored day from storage (summary dates + last 30 days)
      const dateSet = new Set([...Object.keys(summary), TODAY, viewDate, exDate]);
      for (let i = 0; i < 30; i++) dateSet.add(addDays(TODAY, -i));
      for (const d of dateSet) {
        const k = `hassan-day-${d}`;
        if (data[k]) continue;
        try { const v = await store.get(k); if (v) data[k] = v; } catch (e) { /* skip */ }
      }
      const hasContent = weightHistory.length > 0 || foodLog.length > 0 || Object.keys(summary).length > 0 || Object.values(medLog).some(Boolean) || Object.keys(data).length > 6;
      const json = JSON.stringify({ app: "hassan-health", exported: new Date().toISOString(), data });
      setBackupText(json);
      const note = hasContent ? "" : " (Note: this copy of the app looks empty — if you logged data elsewhere, run Export THERE. Each published link/preview has separate storage.)";
      try { await navigator.clipboard.writeText(json); setBackupMsg(`✓ ${Object.keys(data).length} records copied to clipboard!${note}`); }
      catch (e) { setBackupMsg(`✓ Backup generated below — select all and copy manually.${note}`); }
    } catch (e) { setBackupMsg("✗ Export failed: " + e.message); }
  };

  const importBackup = async () => {
    setBackupMsg(null);
    let parsed;
    try {
      parsed = JSON.parse(backupText.trim());
      if (parsed.app !== "hassan-health" || !parsed.data) throw new Error("Not a valid Hassan-tracker backup");
    } catch (e) {
      setBackupMsg("✗ That doesn't look like a valid backup. Paste the complete text you exported earlier (it begins with the app name in quotes).");
      return;
    }
    const entries = Object.entries(parsed.data);
    let written = 0, failed = 0;
    for (const [k, v] of entries) {
      try { const r = await store.set(k, v); if (r) written++; else failed++; }
      catch (e) { failed++; }
    }
    // ALWAYS apply to in-memory state so restore works even if storage writes fail
    try {
      const d = parsed.data;
      if (d["hassan-weight-history"]) setWeightHistory(JSON.parse(d["hassan-weight-history"]));
      if (d["hassan-daily-summary"]) setSummary(JSON.parse(d["hassan-daily-summary"]));
      if (d["hassan-med-last-taken"]) setMedLastTaken(JSON.parse(d["hassan-med-last-taken"]));
      if (d["hassan-meds-list"]) setMeds(JSON.parse(d["hassan-meds-list"]));
      if (d["hassan-cal-target"]) { const o = JSON.parse(d["hassan-cal-target"]); setCalTarget(o.target || TARGETS.calories); setTargetUpdatedOn(o.updatedOn || null); }
      const todayRec = d[`hassan-day-${TODAY}`];
      if (todayRec && viewDate === TODAY) {
        const rec = JSON.parse(todayRec);
        setFoodLog(rec.foodLog || []); setMedLog(rec.medLog || {}); setExRecord(rec.exerciseLog || {}); setExerciseLog(rec.exerciseLog || {}); setWeight(rec.weight || null);
      }
    } catch (e) { console.error("Memory apply error:", e); }

    if (written > 0 && failed === 0) setBackupMsg(`✓ Restored ${written} records and saved to this device. Your history is back!`);
    else if (written > 0) setBackupMsg(`✓ Restored ${entries.length} records to the app. ${written} saved permanently; ${failed} are loaded for this session only (storage limited in this view — use the published Safari version to save permanently).`);
    else setBackupMsg(`✓ Restored ${entries.length} records for this session. Note: permanent saving isn't available in this view — open the published link in Safari to keep them.`);
  };

  const isToday = viewDate === TODAY;

  // ---- Load day record for viewDate ----
  const loadDay = useCallback(async (dateStr, forExercise = false) => {
    if (!forExercise) loadingRef.current = true;
    try {
      let d = {};
      try {
        const v = await store.get(`hassan-day-${dateStr}`);
        if (v) d = JSON.parse(v);
      } catch (e) { /* fall through to mirror */ }
      // If main storage had nothing, try the localStorage mirror (auto-restore)
      if (!d || (!d.foodLog && !d.medLog && !d.exerciseLog)) {
        try { const m = lsGet(`hassan-day-${dateStr}`); if (m) d = JSON.parse(m); } catch (e) {}
      }
      if (forExercise) { setExRecord(d.exerciseLog || {}); }
      else {
        setFoodLog(d.foodLog || []); setMedLog(d.medLog || {});
        setWeight(d.weight || null);
        if (dateStr === exDate) setExRecord(d.exerciseLog || {});
        setExerciseLog(d.exerciseLog || {});
        loadedDateRef.current = dateStr;
      }
    } catch (e) {
      if (forExercise) setExRecord({});
      else { setFoodLog([]); setMedLog({}); setWeight(null); setExerciseLog({}); loadedDateRef.current = dateStr; }
    } finally {
      if (!forExercise) { setTimeout(() => { loadingRef.current = false; }, 0); }
    }
  }, [exDate]);

  // ---- Initial load ----
  useEffect(() => {
    (async () => {
      await loadDay(TODAY);
      const loadKey = async (key, apply) => {
        let val = null;
        try { val = await store.get(key); } catch (e) {}
        if (val) { try { apply(JSON.parse(val)); } catch (e) {} }
      };
      await loadKey("hassan-weight-history", (v) => setWeightHistory(v));
      await loadKey("hassan-cal-target", (o) => { setCalTarget(o.target || TARGETS.calories); setTargetUpdatedOn(o.updatedOn || null); });
      await loadKey("hassan-daily-summary", (v) => setSummary(v));
      await loadKey("hassan-med-last-taken", (v) => setMedLastTaken(v));
      try {
        let mval = null;
        try { mval = await store.get("hassan-meds-list"); } catch (e) {}
        if (mval) {
          const stored = JSON.parse(mval);
          if (!stored.some((x) => x.id === "lipitor") || !stored.find((x) => x.id === "vitd")?.frequencyDays || stored.some((x) => x.name === "Lefsat")) {
            setMeds(DEFAULT_MEDS);
            try { await store.set("hassan-meds-list", JSON.stringify(DEFAULT_MEDS)); } catch (e) {}
          } else setMeds(stored);
        }
      } catch (e) {}
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Reload when viewDate changes ----
  useEffect(() => { if (loaded) loadDay(viewDate); }, [viewDate, loaded, loadDay]);
  // ---- Reload exercise record when exDate changes ----
  useEffect(() => {
    if (!loaded) return;
    if (exDate === viewDate) { setExRecord(exerciseLog); return; }
    loadDay(exDate, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exDate, loaded]);

  // ---- Save day record + summary ----
  const persistDay = useCallback(async (dateStr, record) => {
    const payload = JSON.stringify(record);
    try {
      const res = await store.set(`hassan-day-${dateStr}`, payload);
      if (!res) { setStorageOk(false); }
      // Update summary for graphs (single key = single storage call for charts)
      const ex = EXERCISE_DAYS[weekdayOf(dateStr)];
      const exTotal = ex.exercises.length;
      const exDone = ex.exercises.filter((e) => (record.exerciseLog || {})[e.id]).length;
      const cal = (record.foodLog || []).reduce((a, f) => a + f.calories, 0);
      const protein = (record.foodLog || []).reduce((a, f) => a + f.protein, 0);
      const medsDoneN = Object.values(record.medLog || {}).filter(Boolean).length;
      const newSummary = { ...summary, [dateStr]: { cal, protein, exDone, exTotal, medsDone: medsDoneN, medsTotal: meds.length, target: dateStr === TODAY ? calTarget : (summary[dateStr]?.target ?? calTarget) } };
      setSummary(newSummary);
      const sumPayload = JSON.stringify(newSummary);
      await store.set("hassan-daily-summary", sumPayload);
    } catch (e) { console.error("Save failed", e); setStorageOk(false); }
  }, [summary, meds.length, calTarget]);

  // Save viewDate record on change — GUARDED against the load race:
  // only save if the in-memory data actually belongs to viewDate and we're not mid-load.
  useEffect(() => {
    if (!loaded) return;
    if (loadingRef.current) return;               // a load is in progress — don't save stale/empty state
    if (loadedDateRef.current !== viewDate) return; // memory holds a different date's data — don't overwrite
    persistDay(viewDate, { foodLog, exerciseLog: viewDate === exDate ? exRecord : exerciseLog, medLog, weight });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodLog, medLog, weight, loaded]);

  // Save exercise record on change (may be a different date)
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const v = await store.get(`hassan-day-${exDate}`).catch(() => null);
        const existing = v ? JSON.parse(v) : {};
        await persistDay(exDate, { ...existing, exerciseLog: exRecord });
        if (exDate === viewDate) setExerciseLog(exRecord);
      } catch (e) { console.error(e); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exRecord, loaded]);

  // ---- Totals ----
  const totals = foodLog.reduce((a, f) => ({ calories: a.calories + f.calories, protein: a.protein + f.protein, carbs: a.carbs + f.carbs, fat: a.fat + f.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const remaining = { calories: calTarget - totals.calories, protein: TARGETS.protein - totals.protein, carbs: TARGETS.carbs - totals.carbs };

  // ---- DYNAMIC CALORIE TARGET ----
  // Mifflin-St Jeor (male, 37y, 180cm): BMR = 10×kg + 945. TDEE ≈ BMR × 1.45 (light activity + this program).
  // Deficit sized to weight trend: aim 0.5–0.75 kg/week, slow down near goal.
  const currentWeight = weightHistory.length ? weightHistory[weightHistory.length - 1].weight : 90;
  const weeklyRate = (() => {
    if (weightHistory.length < 2) return null;
    const last = weightHistory[weightHistory.length - 1];
    const ref = [...weightHistory].reverse().find((h) => {
      const days = (new Date(last.date) - new Date(h.date)) / 86400000;
      return days >= 5 && days <= 21;
    });
    if (!ref) return null;
    const days = (new Date(last.date) - new Date(ref.date)) / 86400000;
    return ((ref.weight - last.weight) / days) * 7; // kg lost per week (positive = losing)
  })();

  const recommendedTarget = (() => {
    const bmr = 10 * currentWeight + 945;
    const tdee = bmr * 1.45;
    const kgToGoal = currentWeight - 82;
    let deficit = kgToGoal > 4 ? 600 : kgToGoal > 1.5 ? 450 : 300; // gentler near goal
    // Trend correction: losing too slow → bigger deficit; too fast → smaller
    if (weeklyRate !== null) {
      if (weeklyRate < 0.3 && kgToGoal > 1) deficit += 100;
      else if (weeklyRate > 0.9) deficit -= 150;
    }
    let t = Math.round((tdee - deficit) / 50) * 50;
    return Math.min(1900, Math.max(1500, t)); // safety clamp
  })();

  const daysSinceTargetUpdate = targetUpdatedOn ? Math.floor((new Date(TODAY) - new Date(targetUpdatedOn)) / 86400000) : 999;
  const reviewDue = daysSinceTargetUpdate >= 7 && Math.abs(recommendedTarget - calTarget) >= 50;

  const applyNewTarget = async () => {
    setCalTarget(recommendedTarget);
    setTargetUpdatedOn(TODAY);
    try { await store.set("hassan-cal-target", JSON.stringify({ target: recommendedTarget, updatedOn: TODAY })); } catch (e) {}
  };

  // ---- WEEKLY FOOD MODIFICATIONS ----
  const weekNumber = Math.max(1, Math.ceil((new Date(TODAY) - new Date(weightHistory[0]?.date || TODAY)) / (7 * 86400000)) || 1);
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6)).map((d) => summary[d] || {});
  const avgCal = (() => { const v = last7.map((d) => d.cal).filter((c) => c > 0); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; })();
  const avgProtein = (() => { const v = last7.map((d) => d.protein).filter((p) => p > 0); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; })();

  const getWeeklyMods = () => {
    const mods = [];
    // Adherence-driven
    if (avgCal !== null && avgCal > calTarget + 100) mods.push("📉 You averaged " + avgCal + " kcal vs " + calTarget + " target. Easiest fixes: swap lunch rice/pasta for extra salad 2 days, and make dinner protein + veggies only (skip the optional carb).");
    if (avgCal !== null && avgCal < calTarget - 250) mods.push("⚠️ You averaged " + avgCal + " kcal — too LOW. Under-eating slows metabolism and muscle recovery. Add a handful of almonds or an extra fruit daily.");
    if (avgProtein !== null && avgProtein < 110) mods.push("🥩 Protein averaged " + avgProtein + "g (target 140g). Add: 1 extra egg at breakfast, or swap a fruit snack for Greek yogurt / HiPro.");
    if (weeklyRate !== null && weeklyRate < 0.25 && currentWeight > 84) mods.push("🔄 Weight plateau detected. This week: carb portions (rice/pasta/potato) on training days ONLY (Mon/Tue/Thu/Sat), zero-carb dinners, and add 10 min to your walks.");
    if (weeklyRate !== null && weeklyRate > 1.0) mods.push("🛑 Losing faster than 1 kg/week risks muscle loss. Add 1 extra snack (yogurt + fruit) daily this week — slower is more sustainable.");
    // Rotating weekly focus (cycles each week until goal)
    const rotation = [
      "🐟 Salmon focus week: aim for 3 salmon lunches — best single food for your liver fat and HDL.",
      "🌾 Fiber week: swap white toast → whole-grain, add 1 cup lentil soup at 2 dinners. Soluble fiber directly lowers your LDL.",
      "🍳 Breakfast protein week: 3-egg-white breakfasts daily — higher morning protein reduces evening cravings.",
      "🥗 Volume week: double the salad/veggie portion at lunch & dinner before touching the rest of the plate — natural portion control.",
      "💧 Hydration week: strict 1 glass of water 30 min before EVERY meal. Studies show this alone increases weight loss ~44%.",
      "🚫 Zero-liquid-calories week: no juice at all, whole fruit only. Liquid sugar goes straight to liver fat.",
    ];
    mods.push(rotation[(weekNumber - 1) % rotation.length]);
    return mods;
  };

  // ---- Med due logic ----
  const medDueStatus = (med) => {
    if (!med.frequencyDays) return { due: true, daysLeft: 0 };
    const last = medLastTaken[med.id];
    if (!last || medLog[med.id]) return { due: true, daysLeft: 0 };
    const diff = Math.floor((new Date(viewDate) - new Date(last)) / 86400000);
    const daysLeft = med.frequencyDays - diff;
    return { due: daysLeft <= 0, daysLeft: Math.max(0, daysLeft) };
  };
  const dueMeds = meds.filter((m) => medDueStatus(m).due);
  const medsDone = dueMeds.filter((m) => medLog[m.id]).length;
  const medsTotal = dueMeds.length;

  // ---- Suggestions (today only) ----
  const getSuggestions = () => {
    if (!isToday) return [{ type: "info", text: `Viewing your log from ${prettyDate(viewDate)}. Tap "Today" to return.` }];
    const hour = new Date().getHours();
    const sugg = [];
    const mealsLeft = MEAL_SLOTS.filter((m) => {
      const eaten = foodLog.some((f) => f.slot === m.id);
      const past = (m.id === "breakfast" && hour > 10) || (m.id === "snack1" && hour > 12) || (m.id === "lunch" && hour > 16) || (m.id === "snack2" && hour > 19);
      return !eaten && !past;
    });
    if (remaining.calories < 0) sugg.push({ type: "warn", text: `${Math.abs(remaining.calories)} kcal over budget. Veggies + lean protein only for remaining meals. Add a 30-min walk (~150 kcal offset).` });
    else if (mealsLeft.length > 0) sugg.push({ type: "info", text: `${remaining.calories} kcal left across ${mealsLeft.length} meal(s) ≈ ${Math.round(remaining.calories / mealsLeft.length)} kcal each. Next: ${mealsLeft[0].name}.` });
    if (remaining.protein > 60 && hour > 14) sugg.push({ type: "protein", text: `Still need ${Math.round(remaining.protein)}g protein. Grilled chicken (~31g/100g), tuna (~28g), Greek yogurt (~17g).` });
    else if (remaining.protein <= 0) sugg.push({ type: "good", text: `Protein target hit (${Math.round(totals.protein)}g)! Keep remaining meals light.` });
    if (totals.carbs > TARGETS.carbs) sugg.push({ type: "warn", text: `Carbs over target (${Math.round(totals.carbs)}g/${TARGETS.carbs}g). For your fatty liver — zero carbs rest of today.` });
    const flagged = foodLog.filter((f) => f.flagged);
    if (flagged.length > 0) sugg.push({ type: "medical", text: `⚕️ Avoid-list foods today: ${flagged.map((f) => f.name).join(", ")}. Watch for urticaria symptoms.` });
    const medsNotTaken = meds.filter((m) => !medLog[m.id] && medDueStatus(m).due);
    const morning = medsNotTaken.filter((m) => m.slot === "morning");
    if (morning.length && hour >= 9) sugg.push({ type: "med", text: `💊 ${morning.map((m) => m.name).join(", ")} not yet logged — should be taken before breakfast.` });
    const night = medsNotTaken.filter((m) => m.slot === "night");
    if (night.length && hour >= 21) sugg.push({ type: "med", text: `🌙 Night medicines pending: ${night.map((m) => m.name).join(", ")}.` });
    const todayEx = EXERCISE_DAYS[weekdayOf(TODAY)];
    const done = todayEx.exercises.filter((e) => exerciseLog[e.id]).length;
    if (todayEx.exercises.length > 0 && done < todayEx.exercises.length && hour >= 17) sugg.push({ type: "exercise", text: `${todayEx.exercises.length - done} exercises left — it's only ~20 min total today.` });
    if (sugg.length === 0) sugg.push({ type: "good", text: "Perfectly on track today. Keep going! 💪" });
    return sugg;
  };

  // ---- Food logging ----
  // Food logging works by typing OR using the iPhone keyboard's built-in dictation
  // (tap the text box, then the 🎤 on the keyboard). No in-app mic — the sandbox blocks it.

  const quickLogText = async (slotId) => {
    const text = (inlineText[slotId] || "").trim();
    if (!text || inlineAnalyzing) return;
    setInlineAnalyzing(slotId); setError(null);
    try {
      let parsed, usedFallback = false;
      try {
        parsed = await callClaude(`The user ate: "${text}". Estimate the nutrition with typical portion sizes. ${FOOD_PROMPT_SUFFIX}`);
      } catch (apiError) {
        usedFallback = true;
        parsed = fallbackEstimate(text) || genericEstimate(text, slotId);
      }
      const entry = {
        id: Date.now(), name: parsed.totalName, items: parsed.items || [],
        calories: Math.round(parsed.calories), protein: Math.round(parsed.protein || 0),
        carbs: Math.round(parsed.carbs || 0), fat: Math.round(parsed.fat || 0),
        slot: slotId, flagged: !!parsed.flagged, flagReason: parsed.flagReason || null,
        healthNote: parsed.healthNote || null, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), method: usedFallback ? "estimate" : "ai-text",
        estimated: usedFallback,
      };
      setFoodLog((p) => [...p, entry]);
      setInlineText((p) => ({ ...p, [slotId]: "" }));
      setJustLogged(entry.id); setTimeout(() => setJustLogged(null), 4000);
      if (usedFallback) setError(`Logged "${text}" with an approximate estimate (AI unavailable in this view). Tap the entry's calories to adjust if needed.`);
    } catch (e) { setError(`Couldn't log "${text}". Your text is kept — try again.`); console.error(e); }
    finally { setInlineAnalyzing(null); }
  };

  const analyzePhoto = async (file) => {
    setAnalyzing(true); setError(null); setAnalysisResult(null); setLabelResult(null);
    try {
      const base64 = await fileToBase64(file);
      setImgPreview(URL.createObjectURL(file));
      const prompt = photoMode === "label" ? LABEL_PROMPT : `Analyze this food photo for nutrition tracking. Estimate TOTAL nutrition of everything visible. ${FOOD_PROMPT_SUFFIX}`;
      const parsed = await callClaude([
        { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        { type: "text", text: prompt },
      ]);
      if (photoMode === "label") { setLabelResult(parsed); setLabelQty(1); }
      else setAnalysisResult(parsed);
    } catch (e) {
      if (e.message === "network-unavailable") setError("📷 Photo & label AI analysis needs a network connection that isn't available in this view. Use the meal text box (type or dictate) or tap a plan option instead.");
      else setError("Couldn't analyze the photo. Try a clearer, well-lit image, or log via text instead.");
      console.error(e);
    }
    finally { setAnalyzing(false); }
  };

  const confirmAnalysis = () => {
    if (!analysisResult) return;
    setFoodLog((p) => [...p, {
      id: Date.now(), name: analysisResult.totalName, items: analysisResult.items || [],
      calories: Math.round(analysisResult.calories), protein: Math.round(analysisResult.protein || 0),
      carbs: Math.round(analysisResult.carbs || 0), fat: Math.round(analysisResult.fat || 0),
      slot: selectedSlot, flagged: !!analysisResult.flagged, flagReason: analysisResult.flagReason,
      healthNote: analysisResult.healthNote, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), method: "photo",
    }]);
    setAnalysisResult(null); setImgPreview(null); setTab("dashboard");
  };

  const confirmLabel = () => {
    if (!labelResult) return;
    const q = Math.max(0.1, Number(labelQty) || 1);
    setFoodLog((p) => [...p, {
      id: Date.now(),
      name: `${labelResult.productName} × ${q} serving${q !== 1 ? "s" : ""}`,
      items: [{ name: labelResult.productName, portion: `${q} × ${labelResult.servingSize}` }],
      calories: Math.round(labelResult.calories * q), protein: Math.round((labelResult.protein || 0) * q),
      carbs: Math.round((labelResult.carbs || 0) * q), fat: Math.round((labelResult.fat || 0) * q),
      slot: selectedSlot, flagged: !!labelResult.flagged, flagReason: labelResult.flagReason,
      healthNote: labelResult.healthNote, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), method: "label",
    }]);
    setLabelResult(null); setImgPreview(null); setTab("dashboard");
  };

  const logPlanOption = (slotId, opt) => {
    setFoodLog((p) => [...p, { id: Date.now(), name: opt.name, calories: opt.calories, protein: opt.protein, carbs: opt.carbs, fat: opt.fat, slot: slotId, flagged: false, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), method: "plan" }]);
  };

  const removeFood = (id) => setFoodLog((p) => p.filter((f) => f.id !== id));
  const toggleExerciseAt = (id) => setExRecord((p) => ({ ...p, [id]: !p[id] }));

  const toggleMed = async (id) => {
    const med = meds.find((m) => m.id === id);
    const nowTaken = !medLog[id];
    setMedLog((p) => ({ ...p, [id]: nowTaken ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null }));
    if (med?.frequencyDays) {
      const updated = { ...medLastTaken, [id]: nowTaken ? viewDate : null };
      setMedLastTaken(updated);
      try { await store.set("hassan-med-last-taken", JSON.stringify(updated)); } catch (e) {}
    }
  };

  const renameMed = async (id) => {
    if (!medNameInput.trim()) { setEditingMed(null); return; }
    const updated = meds.map((m) => (m.id === id ? { ...m, name: medNameInput.trim(), note: "Renamed by you" } : m));
    setMeds(updated); setEditingMed(null); setMedNameInput("");
    try { await store.set("hassan-meds-list", JSON.stringify(updated)); } catch (e) {}
  };

  const logWeight = async (w) => {
    const num = parseFloat(w);
    if (!num || num < 50 || num > 150) return;
    setWeight(num);
    const hist = [...weightHistory.filter((h) => h.date !== viewDate), { date: viewDate, weight: num }].sort((a, b) => a.date.localeCompare(b.date));
    setWeightHistory(hist);
    try { await store.set("hassan-weight-history", JSON.stringify(hist)); } catch (e) {}
  };

  // ---- Graph data: last 14 days from summary ----
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(TODAY, i - 13));
  const graphData = last14.map((d) => ({ date: d, ...(summary[d] || {}) }));

  // ---- UI pieces ----
  const Ring = ({ value, max, color, label, unit }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const over = value > max;
    const r = 34, circ = 2 * Math.PI * r;
    return (
      <div style={{ textAlign: "center" }}>
        <svg width="88" height="88" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={r} fill="none" stroke="#EFEBE2" strokeWidth="8" />
          <circle cx="46" cy="46" r={r} fill="none" stroke={over ? "#DC2626" : color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} transform="rotate(-90 46 46)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
          <text x="46" y="43" textAnchor="middle" fontSize="16" fontWeight="700" fill={over ? "#DC2626" : "#1E3A2F"} fontFamily="Georgia, serif">{Math.round(value)}</text>
          <text x="46" y="58" textAnchor="middle" fontSize="9" fill="#6B7280">/ {max}{unit}</text>
        </svg>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#1E3A2F", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      </div>
    );
  };

  const DateNav = ({ value, onChange, allowFuture = false }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
      <button onClick={() => onChange(addDays(value, -1))} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 15, color: "#1E3A2F" }}>◀</button>
      <div style={{ textAlign: "center", minWidth: 150 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1E3A2F" }}>{value === TODAY ? "Today" : prettyDate(value)}</div>
        {value !== TODAY && <button onClick={() => onChange(TODAY)} style={{ border: "none", background: "transparent", color: "#4A7C59", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Jump to Today</button>}
        {value === TODAY && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{prettyDate(value)} · day resets 2 AM</div>}
      </div>
      <button onClick={() => onChange(addDays(value, 1))} disabled={!allowFuture && value >= TODAY}
        style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: (!allowFuture && value >= TODAY) ? "default" : "pointer", fontSize: 15, color: (!allowFuture && value >= TODAY) ? "#D1D5DB" : "#1E3A2F" }}>▶</button>
    </div>
  );

  const BarGraph = ({ title, data, valueKey, maxKey, target, targetKey, color, unit, pctMode }) => {
    const vals = data.map((d) => {
      if (pctMode) { const tot = d[maxKey]; return tot ? Math.round(((d[valueKey] || 0) / tot) * 100) : null; }
      return d[valueKey] ?? null;
    });
    const dayTargets = targetKey ? data.map((d) => d[targetKey] ?? target) : null;
    const maxVal = Math.max(target || 0, ...(dayTargets || []), ...vals.filter((v) => v !== null), 1);
    const W = 560, H = 150, P = 26, colW = (W - 2 * P) / data.length, bw = colW - 4;
    return (
      <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E5E7EB", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 10 }}>{title}</div>
        {vals.every((v) => v === null) ? (
          <div style={{ textAlign: "center", padding: 20, color: "#9CA3AF", fontSize: 12 }}>No data yet — it builds as you log daily</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
            {target && !targetKey && (<>
              <line x1={P} y1={H - P - ((target / maxVal) * (H - 2 * P))} x2={W - P} y2={H - P - ((target / maxVal) * (H - 2 * P))} stroke="#D4A843" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x={W - P} y={H - P - ((target / maxVal) * (H - 2 * P)) - 4} textAnchor="end" fontSize="9" fill="#D4A843" fontWeight="700">{target}{unit}</text>
            </>)}
            {vals.map((v, i) => {
              const tgt = dayTargets ? dayTargets[i] : target;
              const x0 = P + i * colW + 2;
              if (v === null) return (
                <g key={i}>
                  <rect x={x0} y={H - P - 2} width={bw} height={2} fill="#EFEBE2" rx="1" />
                  {dayTargets && <line x1={x0} y1={H - P - ((tgt / maxVal) * (H - 2 * P))} x2={x0 + bw} y2={H - P - ((tgt / maxVal) * (H - 2 * P))} stroke="#D4A843" strokeWidth="2" opacity="0.5" />}
                </g>
              );
              const h = Math.max(3, (v / maxVal) * (H - 2 * P));
              const over = tgt && !pctMode && v > tgt;
              return (
                <g key={i}>
                  <rect x={x0} y={H - P - h} width={bw} height={h} fill={over ? "#DC2626" : color} rx="3" opacity={i === data.length - 1 ? 1 : 0.7} />
                  {dayTargets && <line x1={x0 - 1} y1={H - P - ((tgt / maxVal) * (H - 2 * P))} x2={x0 + bw + 1} y2={H - P - ((tgt / maxVal) * (H - 2 * P))} stroke="#D4A843" strokeWidth="2.5" />}
                  {(i === data.length - 1 || v === Math.max(...vals.filter((x) => x !== null))) && (
                    <text x={x0 + bw / 2} y={H - P - h - 4} textAnchor="middle" fontSize="9" fill="#1E3A2F" fontWeight="700">{v}{pctMode ? "%" : ""}</text>
                  )}
                </g>
              );
            })}
            {dayTargets && <text x={W - P} y={16} textAnchor="end" fontSize="9" fill="#D4A843" fontWeight="700">— daily target</text>}
            <text x={P} y={H - 8} fontSize="9" fill="#9CA3AF">{prettyDate(data[0].date).split(" ").slice(1).join(" ")}</text>
            <text x={W - P} y={H - 8} textAnchor="end" fontSize="9" fill="#9CA3AF">Today</text>
          </svg>
        )}
      </div>
    );
  };

  const suggColors = { warn: "#FEF3C7", info: "#E0F2FE", protein: "#EDE9FE", good: "#D1FAE5", medical: "#FEE2E2", exercise: "#FFF7ED", med: "#FCE7F3" };
  const suggBorders = { warn: "#F59E0B", info: "#0EA5E9", protein: "#8B5CF6", good: "#10B981", medical: "#DC2626", exercise: "#F97316", med: "#EC4899" };

  const exDay = EXERCISE_DAYS[weekdayOf(exDate)];
  const exDone = exDay.exercises.filter((e) => exRecord[e.id]).length;

  // ============ RENDER ============
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8F5EE", minHeight: "100vh", color: "#2C3E50" }}>
      <style>{ANIMS}</style>

      {/* Header */}
      <div style={{ background: "#1E3A2F", color: "white", padding: "16px 20px 12px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#A8D5BA", textTransform: "uppercase", fontFamily: "monospace" }}>Hassan's Tracker</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19 }}>{isToday ? "Today" : prettyDate(viewDate)}</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontFamily: "Georgia, serif", color: remaining.calories < 0 ? "#FCA5A5" : "#A8D5BA" }}>{remaining.calories}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>kcal left</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontFamily: "Georgia, serif", color: medsDone === medsTotal ? "#A8D5BA" : "#FCD34D" }}>{medsDone}/{medsTotal}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>meds</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {storageOk === false && cloudStatus !== "configured" && (
        <div style={{ background: "#FEF3C7", borderBottom: "2px solid #F59E0B", padding: "10px 16px", fontSize: 12, color: "#78350F", lineHeight: 1.5, textAlign: "center" }}>
          ⚠️ <strong>Your data isn't saving permanently here.</strong> Go to <strong>Progress → ☁️ Permanent Cloud Storage</strong> to fix this for good (free, 5-min setup, syncs all devices).
        </div>
      )}
      {cloudStatus === "configured" && (
        <div style={{ background: "#F0FDF4", borderBottom: "1px solid #86EFAC", padding: "6px 16px", fontSize: 11, color: "#065F46", textAlign: "center", fontWeight: 600 }}>
          ☁️ Cloud connected — data saving permanently & syncing
        </div>
      )}
      <div style={{ background: "white", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 10, overflowX: "auto" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", minWidth: 400 }}>
          {[{ id: "dashboard", label: "📊 Today" }, { id: "addfood", label: "📷 Photo" }, { id: "exercise", label: "🏋️ Exercise" }, { id: "meds", label: "💊 Meds" }, { id: "progress", label: "📈 Progress" }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "12px 2px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: tab === t.id ? "#1E3A2F" : "#9CA3AF", whiteSpace: "nowrap",
              borderBottom: tab === t.id ? "3px solid #4A7C59" : "3px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 14px 80px" }}>

        {/* ====== DASHBOARD ====== */}
        {tab === "dashboard" && (
          <>
            <DateNav value={viewDate} onChange={setViewDate} />
            <div style={{ background: "white", borderRadius: 16, padding: "16px 8px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 4, border: "1px solid #E5E7EB", marginBottom: 14 }}>
              <Ring value={totals.calories} max={calTarget} color="#4A7C59" label="Calories" unit="" />
              <Ring value={totals.protein} max={TARGETS.protein} color="#8B5CF6" label="Protein" unit="g" />
              <Ring value={totals.carbs} max={TARGETS.carbs} color="#D4A843" label="Carbs" unit="g" />
              <Ring value={totals.fat} max={TARGETS.fat} color="#C45C2E" label="Fat" unit="g" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 8 }}>Smart Adjustments</div>
              {getSuggestions().map((s, i) => (
                <div key={i} style={{ background: suggColors[s.type], borderLeft: `3px solid ${suggBorders[s.type]}`, borderRadius: "0 10px 10px 0", padding: "11px 13px", fontSize: 13, lineHeight: 1.5, marginBottom: 7 }}>{s.text}</div>
              ))}
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#991B1B", fontSize: 12, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{error}</span>
                <button onClick={() => setError(null)} style={{ border: "none", background: "transparent", color: "#991B1B", cursor: "pointer", fontSize: 15 }}>×</button>
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 8 }}>
              Meals — type, tap a plan option, or snap a photo
            </div>
            {MEAL_SLOTS.map((slot) => {
              const foods = foodLog.filter((f) => f.slot === slot.id);
              const slotCal = foods.reduce((a, f) => a + f.calories, 0);
              const hasEaten = foods.length > 0;
              return (
                <div key={slot.id} style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 10, border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{slot.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E3A2F" }}>{slot.name}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>{slot.time} · budget {slot.budget} kcal</div>
                      </div>
                    </div>
                    <div><span style={{ fontFamily: "Georgia, serif", fontSize: 17, color: slotCal > slot.budget ? "#DC2626" : "#4A7C59" }}>{slotCal}</span><span style={{ fontSize: 10, color: "#9CA3AF" }}> kcal</span></div>
                  </div>

                  {foods.map((f) => (
                    <div key={f.id} style={{
                      marginTop: 8, padding: "9px 11px", background: f.flagged ? "#FEF2F2" : "#F0FDF4", borderRadius: 8, fontSize: 13,
                      border: justLogged === f.id ? "2px solid #4A7C59" : "none",
                      animation: justLogged === f.id ? "logFlash 0.5s ease" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600 }}>{{ photo: "📷 ", "ai-text": "✨ ", plan: "✅ ", label: "🏷️ ", estimate: "≈ ", manual: "✏️ " }[f.method]}{f.name}</span>
                          {justLogged === f.id && <span style={{ fontSize: 9, background: "#4A7C59", color: "white", borderRadius: 4, padding: "1px 6px", marginLeft: 5, fontWeight: 700 }}>LOGGED ✓</span>}
                          {f.flagged && <span style={{ fontSize: 9, background: "#DC2626", color: "white", borderRadius: 4, padding: "1px 5px", marginLeft: 5, fontWeight: 700 }}>AVOID</span>}
                          {editingCal === f.id ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                              <input type="number" autoFocus defaultValue={f.calories} id={`cal-${f.id}`} style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: "1.5px solid #4A7C59", fontSize: 13 }} />
                              <span style={{ fontSize: 11, color: "#6B7280" }}>kcal</span>
                              <button onClick={() => { const v = parseInt(document.getElementById(`cal-${f.id}`)?.value); if (v >= 0) setFoodLog((p) => p.map((x) => x.id === f.id ? { ...x, calories: v, estimated: false } : x)); setEditingCal(null); }} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#1E3A2F", color: "#A8D5BA", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                              <span onClick={() => setEditingCal(f.id)} style={{ cursor: "pointer", borderBottom: f.estimated ? "1px dashed #C45C2E" : "none", color: f.estimated ? "#C45C2E" : "#6B7280", fontWeight: f.estimated ? 700 : 400 }}>{f.calories} kcal{f.estimated ? " ✎" : ""}</span> · P {f.protein}g · C {f.carbs}g · F {f.fat}g · {f.time}
                            </div>
                          )}
                          {f.items && f.items.length > 1 && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{f.items.map((i) => `${i.name} (${i.portion})`).join(" · ")}</div>}
                          {f.healthNote && <div style={{ fontSize: 11, color: "#4A7C59", marginTop: 3, fontStyle: "italic" }}>{f.healthNote}</div>}
                        </div>
                        <button onClick={() => removeFood(f.id)} style={{ border: "none", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                    <input
                      value={inlineText[slot.id] || ""}
                      onChange={(e) => setInlineText((p) => ({ ...p, [slot.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") quickLogText(slot.id); }}
                      placeholder="✨ Type or dictate what you ate…"
                      disabled={inlineAnalyzing === slot.id}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13,
                        border: "1.5px solid " + (inlineAnalyzing === slot.id ? "#4A7C59" : "#D1E7D8"),
                        background: inlineAnalyzing === slot.id ? "#F0FDF4" : "white", outline: "none", boxSizing: "border-box", minWidth: 0,
                      }}
                    />
                    <button onClick={() => quickLogText(slot.id)} disabled={inlineAnalyzing === slot.id || !(inlineText[slot.id] || "").trim()}
                      style={{
                        padding: "10px 14px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13, flexShrink: 0,
                        cursor: (inlineText[slot.id] || "").trim() && !inlineAnalyzing ? "pointer" : "default",
                        background: inlineAnalyzing === slot.id ? "#A8D5BA" : (inlineText[slot.id] || "").trim() ? "#1E3A2F" : "#E5E7EB",
                        color: inlineAnalyzing === slot.id ? "#1E3A2F" : (inlineText[slot.id] || "").trim() ? "#A8D5BA" : "#9CA3AF", whiteSpace: "nowrap",
                      }}>
                      {inlineAnalyzing === slot.id ? "🔍" : "✨ Log"}
                    </button>
                  </div>
                  {inlineAnalyzing === slot.id && <div style={{ fontSize: 11, color: "#4A7C59", marginTop: 5, fontStyle: "italic" }}>AI estimating & logging automatically…</div>}

                  {!hasEaten && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#4A7C59", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Or tap a plan option:</div>
                      {slot.planOptions.map((opt, i) => (
                        <button key={i} onClick={() => logPlanOption(slot.id, opt)} style={{
                          display: "block", width: "100%", textAlign: "left", padding: "9px 11px", marginBottom: 5,
                          borderRadius: 8, border: "1px solid #D1E7D8", background: "#F8FBF9", cursor: "pointer", fontSize: 12,
                        }}>
                          <span style={{ fontWeight: 600, color: "#1E3A2F" }}>{opt.name}</span>
                          <span style={{ float: "right", fontFamily: "monospace", color: "#4A7C59", fontSize: 11 }}>{opt.calories} kcal</span>
                          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>P {opt.protein}g · C {opt.carbs}g · F {opt.fat}g</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setSelectedSlot(slot.id); setTab("addfood"); }} style={{ marginTop: 6, width: "100%", padding: 7, border: "1px dashed #C9C4B8", borderRadius: 8, background: "transparent", color: "#9CA3AF", fontSize: 11, cursor: "pointer" }}>
                    📷 Photo of meal or 🏷️ nutrition label →
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* ====== PHOTO / LABEL ====== */}
        {tab === "addfood" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 8 }}>Log to which meal?</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {MEAL_SLOTS.map((s) => (
                <button key={s.id} onClick={() => setSelectedSlot(s.id)} style={{
                  padding: "7px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: selectedSlot === s.id ? "2px solid #1E3A2F" : "1px solid #E5E7EB",
                  background: selectedSlot === s.id ? "#1E3A2F" : "white",
                  color: selectedSlot === s.id ? "#A8D5BA" : "#6B7280",
                }}>{s.icon} {s.name}</button>
              ))}
            </div>

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[{ id: "meal", label: "📷 Photo of Meal", sub: "AI estimates the whole plate" }, { id: "label", label: "🏷️ Nutrition Label", sub: "AI reads the facts panel + you set quantity" }].map((m) => (
                <button key={m.id} onClick={() => { setPhotoMode(m.id); setAnalysisResult(null); setLabelResult(null); setImgPreview(null); }} style={{
                  flex: 1, padding: "12px 10px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: photoMode === m.id ? "2px solid #1E3A2F" : "1px solid #E5E7EB",
                  background: photoMode === m.id ? "#1E3A2F" : "white",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: photoMode === m.id ? "#A8D5BA" : "#1E3A2F" }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: photoMode === m.id ? "rgba(255,255,255,0.7)" : "#9CA3AF", marginTop: 2 }}>{m.sub}</div>
                </button>
              ))}
            </div>

            {!analyzing && !analysisResult && !labelResult && (
              <div onClick={() => fileRef.current?.click()} style={{ background: "white", border: "2px dashed #4A7C59", borderRadius: 16, padding: "34px 20px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{photoMode === "label" ? "🏷️" : "📷"}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1E3A2F", marginBottom: 4 }}>
                  {photoMode === "label" ? "Snap the Nutrition Facts label" : "Snap or upload your food"}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {photoMode === "label" ? "Hold steady, good lighting, label flat. Then choose how many servings you ate." : "AI estimates macros & checks your medical avoid-list"}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzePhoto(f); e.target.value = ""; }} />
              </div>
            )}

            {analyzing && (
              <div style={{ background: "white", borderRadius: 20, padding: 36, textAlign: "center", border: "1px solid #E5E7EB" }}>
                {imgPreview && <img src={imgPreview} alt="food" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 12, marginBottom: 14, objectFit: "cover" }} />}
                <div style={{ fontSize: 30, marginBottom: 8, animation: "pulse 1.2s infinite" }}>🔍</div>
                <div style={{ fontWeight: 700, color: "#1E3A2F" }}>{photoMode === "label" ? "Reading the label…" : "Analyzing your food…"}</div>
              </div>
            )}

            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 14, color: "#991B1B", fontSize: 13, marginTop: 12 }}>{error}</div>}

            {/* Meal photo result */}
            {analysisResult && (
              <div style={{ background: "white", borderRadius: 20, padding: 20, border: "1px solid #E5E7EB", marginTop: 14 }}>
                {imgPreview && <img src={imgPreview} alt="food" style={{ width: "100%", maxHeight: 220, borderRadius: 12, marginBottom: 14, objectFit: "cover" }} />}
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#1E3A2F", marginBottom: 4 }}>{analysisResult.totalName}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>{(analysisResult.items || []).map((i) => `${i.name} (${i.portion})`).join(" · ")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                  {[{ l: "Calories", v: Math.round(analysisResult.calories), c: "#4A7C59" }, { l: "Protein", v: Math.round(analysisResult.protein) + "g", c: "#8B5CF6" }, { l: "Carbs", v: Math.round(analysisResult.carbs) + "g", c: "#D4A843" }, { l: "Fat", v: Math.round(analysisResult.fat) + "g", c: "#C45C2E" }].map((m) => (
                    <div key={m.l} style={{ background: "#F8F5EE", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#6B7280" }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {analysisResult.flagged && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12, fontSize: 13, color: "#991B1B", marginBottom: 12 }}>⚠️ <strong>On your avoid list:</strong> {analysisResult.flagReason}</div>}
                {analysisResult.healthNote && <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 12, fontSize: 13, color: "#065F46", marginBottom: 14 }}>💡 {analysisResult.healthNote}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setAnalysisResult(null); setImgPreview(null); }} style={{ flex: 1, padding: 13, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", color: "#6B7280", fontWeight: 600, cursor: "pointer" }}>Discard</button>
                  <button onClick={confirmAnalysis} style={{ flex: 2, padding: 13, borderRadius: 10, border: "none", background: "#1E3A2F", color: "#A8D5BA", fontWeight: 700, cursor: "pointer" }}>✓ Log to {MEAL_SLOTS.find((s) => s.id === selectedSlot)?.name}</button>
                </div>
              </div>
            )}

            {/* Label result with quantity */}
            {labelResult && (
              <div style={{ background: "white", borderRadius: 20, padding: 20, border: "1px solid #E5E7EB", marginTop: 14 }}>
                {imgPreview && <img src={imgPreview} alt="label" style={{ width: "100%", maxHeight: 200, borderRadius: 12, marginBottom: 14, objectFit: "contain", background: "#F8F5EE" }} />}
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#1E3A2F" }}>{labelResult.productName}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>Per serving ({labelResult.servingSize}): {Math.round(labelResult.calories)} kcal · P {Math.round(labelResult.protein)}g · C {Math.round(labelResult.carbs)}g · F {Math.round(labelResult.fat)}g</div>

                <div style={{ background: "#F8F5EE", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6B7280", marginBottom: 8 }}>How many servings did you eat?</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => setLabelQty((q) => Math.max(0.5, Math.round((Number(q) - 0.5) * 2) / 2))} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #C9C4B8", background: "white", fontSize: 18, cursor: "pointer", color: "#1E3A2F" }}>−</button>
                    <input type="number" step="0.5" min="0.5" value={labelQty} onChange={(e) => setLabelQty(e.target.value)}
                      style={{ width: 70, padding: "9px 6px", borderRadius: 10, border: "1.5px solid #4A7C59", fontSize: 17, fontWeight: 700, textAlign: "center", color: "#1E3A2F" }} />
                    <button onClick={() => setLabelQty((q) => Math.round((Number(q) + 0.5) * 2) / 2)} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #C9C4B8", background: "white", fontSize: 18, cursor: "pointer", color: "#1E3A2F" }}>+</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                  {[{ l: "Calories", v: Math.round(labelResult.calories * (Number(labelQty) || 1)), c: "#4A7C59" }, { l: "Protein", v: Math.round(labelResult.protein * (Number(labelQty) || 1)) + "g", c: "#8B5CF6" }, { l: "Carbs", v: Math.round(labelResult.carbs * (Number(labelQty) || 1)) + "g", c: "#D4A843" }, { l: "Fat", v: Math.round(labelResult.fat * (Number(labelQty) || 1)) + "g", c: "#C45C2E" }].map((m) => (
                    <div key={m.l} style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #BBF7D0" }}>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#6B7280" }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {labelResult.flagged && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12, fontSize: 13, color: "#991B1B", marginBottom: 12 }}>⚠️ {labelResult.flagReason}</div>}
                {labelResult.healthNote && <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 12, fontSize: 13, color: "#065F46", marginBottom: 14 }}>💡 {labelResult.healthNote}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setLabelResult(null); setImgPreview(null); }} style={{ flex: 1, padding: 13, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", color: "#6B7280", fontWeight: 600, cursor: "pointer" }}>Discard</button>
                  <button onClick={confirmLabel} style={{ flex: 2, padding: 13, borderRadius: 10, border: "none", background: "#1E3A2F", color: "#A8D5BA", fontWeight: 700, cursor: "pointer" }}>✓ Log {labelQty} serving{Number(labelQty) !== 1 ? "s" : ""}</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ====== EXERCISE ====== */}
        {tab === "exercise" && (
          <>
            <DateNav value={exDate} onChange={setExDate} allowFuture />
            <div style={{ background: "#1E3A2F", borderRadius: 16, padding: 18, color: "white", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#A8D5BA", textTransform: "uppercase" }}>{exDate === TODAY ? "Today's Session" : prettyDate(exDate)}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20 }}>{exDay.icon} {exDay.name}</div>
                {exDay.duration && <div style={{ fontSize: 11, color: "#A8D5BA", marginTop: 2 }}>⏱ {exDay.duration} total</div>}
              </div>
              {exDay.exercises.length > 0 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#A8D5BA" }}>{exDone}/{exDay.exercises.length}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Done</div>
                </div>
              )}
            </div>

            {exDay.exercises.length === 0 ? (
              <div style={{ background: "white", borderRadius: 16, padding: 36, textAlign: "center", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>😴</div>
                <div style={{ fontWeight: 700, color: "#1E3A2F", fontSize: 16 }}>Full Rest Day</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>Muscles, tendons — and hormones — rebuild on rest days.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 10, fontStyle: "italic" }}>Animations show the movement. Tap a card for step-by-step instructions; tap the circle to mark done.</div>
                {exDay.exercises.map((ex) => {
                  const expanded = expandedExercise === ex.id;
                  const done = exRecord[ex.id];
                  return (
                    <div key={ex.id} style={{
                      background: done ? "#F0FDF4" : "white", border: done ? "1px solid #86EFAC" : "1px solid #E5E7EB",
                      borderRadius: 14, marginBottom: 10, overflow: "hidden",
                    }}>
                      <div style={{ padding: 13, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedExercise(expanded ? null : ex.id)}>
                        <Illo type={ex.illo} anim={ex.anim} size={expanded ? 116 : 72} animate={!done} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1E3A2F", textDecoration: done ? "line-through" : "none" }}>{ex.name}</div>
                          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#4A7C59", fontWeight: 600, margin: "2px 0" }}>{ex.sets}</div>
                          <div style={{ fontSize: 11, color: "#6B7280" }}>{ex.focus}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>{expanded ? "▲ Hide steps" : "▼ How to do it"}</div>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); toggleExerciseAt(ex.id); }} style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          border: done ? "none" : "2px solid #C9C4B8", background: done ? "#4A7C59" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
                        }}>{done ? "✓" : ""}</div>
                      </div>
                      {expanded && (
                        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F3F4F6" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#4A7C59", textTransform: "uppercase", letterSpacing: 1, margin: "12px 0 8px" }}>How to perform:</div>
                          {ex.steps.map((st, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1E3A2F", color: "#A8D5BA", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                              <div>{st}</div>
                            </div>
                          ))}
                          {videoFor(ex) && (
                            <a href={videoFor(ex)} target="_blank" rel="noopener noreferrer" style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, padding: "10px 14px",
                              borderRadius: 10, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontWeight: 700, fontSize: 13, textDecoration: "none",
                            }}>
                              ▶️ Watch a video demo of this exercise
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 13, marginTop: 12, fontSize: 12, color: "#991B1B", lineHeight: 1.6 }}>
              <strong>⚠️ Safety:</strong> No overhead pressing · No jumping/running · Shallow squats only · Stop at sharp pain
            </div>
            <div style={{ background: "#EDE9FE", border: "1px solid #DDD6FE", borderRadius: 12, padding: 13, marginTop: 8, fontSize: 12, color: "#5B21B6", lineHeight: 1.6 }}>
              <strong>💜 Why kegels & bridges are in your plan:</strong> Research (incl. randomized trials) shows pelvic floor exercises + aerobic activity significantly improve erectile function — comparable to medication in some studies. Combined with your weight loss and better circulation from this program, expect noticeable benefits in 4–8 weeks of consistency.
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", margin: "18px 0 8px" }}>Weekly Plan (~20 min/day)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 8 }}>
              {DAY_KEYS.map((d) => {
                const isExToday = d === weekdayOf(exDate);
                return (
                  <div key={d} style={{ background: isExToday ? "#1E3A2F" : "white", color: isExToday ? "white" : "#2C3E50", borderRadius: 10, padding: 11, border: "1px solid " + (isExToday ? "#1E3A2F" : "#E5E7EB"), fontSize: 12 }}>
                    <div style={{ fontWeight: 700, textTransform: "capitalize", color: isExToday ? "#A8D5BA" : "#1E3A2F" }}>{d.slice(0, 3)}</div>
                    <div style={{ fontSize: 10, color: isExToday ? "rgba(255,255,255,0.7)" : "#6B7280", marginTop: 2 }}>{EXERCISE_DAYS[d].icon} {EXERCISE_DAYS[d].name}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ====== MEDS ====== */}
        {tab === "meds" && (
          <>
            <DateNav value={viewDate} onChange={setViewDate} />
            <div style={{ background: "#1E3A2F", borderRadius: 16, padding: 18, color: "white", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#A8D5BA", textTransform: "uppercase" }}>{isToday ? "Daily Medicines" : prettyDate(viewDate)}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20 }}>💊 {medsDone === medsTotal ? "All taken!" : `${medsTotal - medsDone} remaining`}</div>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: medsDone === medsTotal ? "#A8D5BA" : "#FCD34D" }}>{medsDone}/{medsTotal}</div>
            </div>

            {["morning", "midday", "night"].map((slotKey) => {
              const slotMeds = meds.filter((m) => m.slot === slotKey);
              if (!slotMeds.length) return null;
              const labels = { morning: "🌅 Morning — Before Breakfast", midday: "🍽️ With Fatty Meal (Lunch)", night: "🌙 Night" };
              return (
                <div key={slotKey} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 8 }}>{labels[slotKey]}</div>
                  {slotMeds.map((m) => {
                    const taken = medLog[m.id];
                    const status = medDueStatus(m);
                    const notDue = !status.due;
                    return (
                      <div key={m.id} style={{
                        background: taken ? "#F0FDF4" : notDue ? "#F9FAFB" : "white",
                        border: taken ? "1px solid #86EFAC" : "1px solid #E5E7EB",
                        borderRadius: 14, padding: 14, marginBottom: 8, display: "flex", gap: 12, alignItems: "center", opacity: notDue ? 0.6 : 1,
                      }}>
                        <div style={{ fontSize: 26 }}>{m.icon}</div>
                        <div style={{ flex: 1 }}>
                          {editingMed === m.id ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <input autoFocus value={medNameInput} onChange={(e) => setMedNameInput(e.target.value)} placeholder="Medicine name"
                                style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #4A7C59", fontSize: 13 }} />
                              <button onClick={() => renameMed(m.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#1E3A2F", color: "#A8D5BA", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                            </div>
                          ) : (
                            <>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#1E3A2F" }}>
                                {m.name} <span style={{ fontWeight: 400, fontSize: 12, color: "#6B7280" }}>· {m.dose}</span>
                                <button onClick={() => { setEditingMed(m.id); setMedNameInput(m.name); }} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 11, marginLeft: 4 }}>✏️</button>
                              </div>
                              <div style={{ fontSize: 11, color: "#6B7280" }}>{m.timing}</div>
                              <div style={{ fontSize: 10, color: "#4A7C59", fontStyle: "italic", marginTop: 2 }}>{m.note}</div>
                              {m.frequencyDays && status.due && !taken && <div style={{ fontSize: 10, fontWeight: 700, color: "#C45C2E", marginTop: 3 }}>📅 DUE TODAY — with your fattiest meal</div>}
                              {notDue && <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", marginTop: 3 }}>⏳ Not due — next dose in {status.daysLeft} day{status.daysLeft > 1 ? "s" : ""}</div>}
                              {taken && <div style={{ fontSize: 10, color: "#10B981", fontWeight: 600, marginTop: 2 }}>✓ Taken at {taken}{m.frequencyDays ? ` — next in ${m.frequencyDays} days` : ""}</div>}
                            </>
                          )}
                        </div>
                        <div onClick={() => { if (!notDue) toggleMed(m.id); }} style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0, cursor: notDue ? "default" : "pointer",
                          border: taken ? "none" : "2px solid " + (notDue ? "#E5E7EB" : "#C9C4B8"), background: taken ? "#4A7C59" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, fontWeight: 700,
                        }}>{taken ? "✓" : ""}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div style={{ background: "#FFF8ED", border: "1px solid #FDE68A", borderRadius: 12, padding: 14, fontSize: 12, color: "#78350F", lineHeight: 1.6 }}>
              <strong>💡 Tips:</strong> Controloc 30–60 min before breakfast · Vitamin D every 3 days only (app tracks it) · Lipitor at night, NO grapefruit · Levcet at night helps urticaria & sleep · Report unusual muscle pain (rare statin side effect)
            </div>
          </>
        )}

        {/* ====== PROGRESS ====== */}
        {tab === "progress" && (
          <>
            {/* WEEKLY REVIEW — dynamic target + food modifications */}
            <div style={{ background: "#1E3A2F", borderRadius: 16, padding: 18, color: "white", marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#A8D5BA", textTransform: "uppercase", marginBottom: 6 }}>📋 Weekly Review · Week {weekNumber}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "#A8D5BA" }}>{calTarget} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>kcal/day target</span></div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                    {currentWeight} kg now · {Math.max(0, (currentWeight - 82)).toFixed(1)} kg to goal
                    {weeklyRate !== null && ` · trend: ${weeklyRate > 0 ? "−" : "+"}${Math.abs(weeklyRate).toFixed(2)} kg/week`}
                  </div>
                </div>
                {reviewDue ? (
                  <div style={{ background: "rgba(168,213,186,0.15)", border: "1px solid rgba(168,213,186,0.4)", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#A8D5BA", marginBottom: 4 }}>Recalculated for your current weight & trend:</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "white" }}>{recommendedTarget} kcal</div>
                    <button onClick={applyNewTarget} style={{ marginTop: 6, padding: "7px 16px", borderRadius: 8, border: "none", background: "#A8D5BA", color: "#1E3A2F", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Apply New Target
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", maxWidth: 180, textAlign: "right" }}>
                    {Math.abs(recommendedTarget - calTarget) < 50
                      ? "✓ Target is right for your current weight & trend"
                      : `Next review in ${Math.max(0, 7 - daysSinceTargetUpdate)} day(s)`}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                Target auto-recalculates weekly (Mifflin-St Jeor for your stats) and as you lose weight — your body burns fewer calories at lower weights, so the target gently decreases to keep progress steady, then eases near goal to protect muscle.
              </div>
            </div>

            {/* This week's food modifications */}
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E5E7EB", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 10 }}>🍽️ This Week's Food Modifications</div>
              {getWeeklyMods().map((m, i) => (
                <div key={i} style={{ background: "#F8FBF9", border: "1px solid #D1E7D8", borderRadius: 10, padding: "10px 13px", fontSize: 13, lineHeight: 1.5, marginBottom: 7 }}>{m}</div>
              ))}
              {avgCal !== null && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Based on last 7 days: avg {avgCal} kcal{avgProtein !== null ? `, ${avgProtein}g protein` : ""}.</div>}
            </div>

            {/* Weight */}
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E5E7EB", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 10 }}>⚖️ Log Weight</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="number" step="0.1" placeholder={weight ? `${weight} kg logged` : "e.g. 89.5"} id="wt-input"
                  style={{ flex: 1, padding: "11px 13px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 15 }} />
                <button onClick={() => { const el = document.getElementById("wt-input"); if (el?.value) { logWeight(el.value); el.value = ""; } }}
                  style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: "#1E3A2F", color: "#A8D5BA", fontWeight: 700, cursor: "pointer" }}>Save</button>
              </div>
            </div>

            {/* Weight chart */}
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E5E7EB", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 10 }}>Weight Journey → 82 kg</div>
              {weightHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: 26, color: "#9CA3AF", fontSize: 13 }}>Log your first weight to start the chart 📉</div>
              ) : <WeightChart history={weightHistory} target={82} />}
            </div>

            {/* New graphs */}
            <BarGraph title="🔥 Daily Calories: Target vs Actual (last 14 days)" data={graphData} valueKey="cal" target={calTarget} targetKey="target" color="#4A7C59" unit="" />
            <BarGraph title="🏋️ Exercise Completion % (last 14 days)" data={graphData} valueKey="exDone" maxKey="exTotal" pctMode target={100} color="#8B5CF6" unit="%" />
            <BarGraph title="💊 Medicine Adherence % (last 14 days)" data={graphData} valueKey="medsDone" maxKey="medsTotal" pctMode target={100} color="#EC4899" unit="%" />

            {/* Cloud Storage Setup — the permanent fix */}
            <div style={{ background: cloudStatus === "configured" ? "#F0FDF4" : "#FFF8ED", borderRadius: 16, padding: 18, border: "1px solid " + (cloudStatus === "configured" ? "#86EFAC" : "#FDE68A"), marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: cloudStatus === "configured" ? "#065F46" : "#78350F", marginBottom: 6 }}>
                ☁️ Permanent Cloud Storage {cloudStatus === "configured" ? "· ✓ Connected" : "· ⚠️ Not set up"}
              </div>
              {cloudStatus === "configured" ? (
                <>
                  <div style={{ fontSize: 12, color: "#065F46", lineHeight: 1.5, marginBottom: 10 }}>
                    Your data saves permanently to your private cloud database and syncs across iPhone, laptop, and any device. This survives app closes, iOS storage clearing — everything.
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 10 }}>Account code: <strong>{cloudCfg.user}</strong></div>
                  <button onClick={pullFromCloud} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #4A7C59", background: "white", color: "#1E3A2F", fontWeight: 700, fontSize: 12, cursor: "pointer", marginRight: 8 }}>🔄 Sync now</button>
                  <button onClick={disconnectCloud} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #E5E7EB", background: "white", color: "#9CA3AF", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Disconnect</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.5, marginBottom: 12 }}>
                    <strong>This permanently fixes data loss.</strong> Browser storage on iPhone gets wiped by iOS. Connecting a free cloud database (like the big fitness apps use) keeps your data forever and syncs everywhere. One-time 5-min setup — instructions below the fields.
                  </div>
                  <input value={cloudCfg.url} onChange={(e) => setCloudCfg((c) => ({ ...c, url: e.target.value }))} placeholder="Project URL (https://xxxx.supabase.co)"
                    style={{ width: "100%", padding: "10px 12px", marginBottom: 8, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
                  <input value={cloudCfg.key} onChange={(e) => setCloudCfg((c) => ({ ...c, key: e.target.value }))} placeholder="anon public API key" type="password"
                    style={{ width: "100%", padding: "10px 12px", marginBottom: 8, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
                  <input value={cloudCfg.user} onChange={(e) => setCloudCfg((c) => ({ ...c, user: e.target.value }))} placeholder="Pick any personal code (e.g. hassan2026)"
                    style={{ width: "100%", padding: "10px 12px", marginBottom: 10, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
                  <button onClick={saveCloudConfig} disabled={cloudStatus === "testing"} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#1E3A2F", color: "#A8D5BA", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {cloudStatus === "testing" ? "🔄 Connecting…" : "Connect Cloud Storage"}
                  </button>
                  <details style={{ marginTop: 12, fontSize: 12, color: "#78350F" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 700 }}>📋 Setup instructions (tap to expand)</summary>
                    <ol style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
                      <li>Go to <strong>supabase.com</strong> → sign up free → "New Project" (pick any name/password, free tier).</li>
                      <li>Wait ~2 min for it to provision. Then open the <strong>SQL Editor</strong> (left menu) → "New query" → paste this and click Run:
                        <div style={{ background: "#1E293B", color: "#A8D5BA", borderRadius: 8, padding: 10, marginTop: 6, fontFamily: "monospace", fontSize: 10.5, lineHeight: 1.4, whiteSpace: "pre-wrap", userSelect: "all" }}>{`create table kv (
  user_code text,
  k text,
  v text,
  updated_at timestamptz,
  primary key (user_code, k)
);
alter table kv enable row level security;
create policy "public" on kv
  for all using (true) with check (true);`}</div>
                      </li>
                      <li>Go to <strong>Settings → API</strong>. Copy the <strong>Project URL</strong> into the first field above, and the <strong>anon public</strong> key into the second field.</li>
                      <li>Pick any personal code for the third field (e.g. "hassan2026") — use the same one on every device to sync.</li>
                      <li>Tap <strong>Connect Cloud Storage</strong>. Done — data is now permanent!</li>
                    </ol>
                  </details>
                </>
              )}
              {cloudMsg && <div style={{ fontSize: 12, marginTop: 10, fontWeight: 600, color: cloudMsg.startsWith("✓") ? "#10B981" : cloudMsg.startsWith("✗") ? "#DC2626" : "#6B7280" }}>{cloudMsg}</div>}
            </div>

            {/* Backup & Sync */}
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E5E7EB", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 6 }}>☁️ Backup & Sync Across Devices</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10, lineHeight: 1.5 }}>
                Your data syncs automatically when you're logged into the same Claude account on each device. Use backup as extra protection or to move data manually.
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={exportBackup} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "#1E3A2F", color: "#A8D5BA", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>⬆️ Export Backup</button>
                <button onClick={importBackup} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid #1E3A2F", background: "white", color: "#1E3A2F", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>⬇️ Import / Restore</button>
              </div>
              <textarea
                value={backupText}
                onChange={(e) => setBackupText(e.target.value)}
                placeholder="Export fills this box (and copies to clipboard). To restore on another device: paste the backup text here, then tap Import."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 11, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }}
              />
              {backupMsg && <div style={{ fontSize: 12, marginTop: 8, fontWeight: 600, color: backupMsg.startsWith("✓") ? "#10B981" : "#DC2626" }}>{backupMsg}</div>}
            </div>

            {/* Milestones */}
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#6B7280", marginBottom: 12 }}>Milestones</div>
              {[
                { w: 88, label: "First milestone — momentum built", icon: "🌱" },
                { w: 85, label: "Liver fat actively reversing", icon: "🫁" },
                { w: 83, label: "7-10% loss — major medical win", icon: "🏥" },
                { w: 82, label: "TARGET REACHED — healthy BMI zone", icon: "🎯" },
              ].map((m) => {
                const current = weightHistory.length ? weightHistory[weightHistory.length - 1].weight : 90;
                const hit = current <= m.w;
                return (
                  <div key={m.w} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #F3F4F6", opacity: hit ? 1 : 0.55 }}>
                    <div style={{ fontSize: 20 }}>{hit ? "✅" : m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1E3A2F" }}>{m.w} kg</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{m.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============ WEIGHT CHART ============
function WeightChart({ history, target }) {
  const W = 560, H = 180, P = 36;
  const weights = history.map((h) => h.weight);
  const min = Math.min(target - 1, ...weights) - 1;
  const max = Math.max(...weights) + 1;
  const x = (i) => P + (i / Math.max(1, history.length - 1)) * (W - 2 * P);
  const y = (w) => H - P - ((w - min) / (max - min)) * (H - 2 * P);
  const path = history.map((h, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(h.weight)}`).join(" ");
  const latest = history[history.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <line x1={P} y1={y(target)} x2={W - P} y2={y(target)} stroke="#D4A843" strokeWidth="2" strokeDasharray="6 4" />
      <text x={W - P} y={y(target) - 6} textAnchor="end" fontSize="11" fill="#D4A843" fontWeight="700">Target {target} kg</text>
      <path d={path} fill="none" stroke="#4A7C59" strokeWidth="3" strokeLinecap="round" />
      {history.map((h, i) => (
        <g key={h.date}>
          <circle cx={x(i)} cy={y(h.weight)} r="5" fill="#1E3A2F" stroke="white" strokeWidth="2" />
          {(i === 0 || i === history.length - 1) && <text x={x(i)} y={y(h.weight) - 10} textAnchor="middle" fontSize="12" fill="#1E3A2F" fontWeight="700" fontFamily="Georgia">{h.weight}</text>}
        </g>
      ))}
      <text x={P} y={H - 8} fontSize="10" fill="#9CA3AF">{history[0].date}</text>
      <text x={W - P} y={H - 8} textAnchor="end" fontSize="10" fill="#9CA3AF">{latest.date}</text>
    </svg>
  );
}
